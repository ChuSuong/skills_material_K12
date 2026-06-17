import os
import sys
from pathlib import Path
import json
from typing import Any

import cv2
import numpy as np
import torch
import trimesh
from PIL import Image

try:
    from rembg import new_session, remove

    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    new_session = None
    remove = None


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[6]


def _add_source_path(env_name: str, default_relative_path: str) -> None:
    source_path = Path(os.environ.get(env_name, str(_repo_root() / default_relative_path)))
    if source_path.exists() and str(source_path) not in sys.path:
        sys.path.insert(0, str(source_path))


def _configure_trellis_imports() -> None:
    os.environ.setdefault("ATTN_BACKEND", "flash_attn")
    os.environ.setdefault("SPARSE_ATTN_BACKEND", "flash_attn")
    os.environ.setdefault("SPCONV_ALGO", "native")
    os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")
    os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

    _add_source_path("TRELLIS_SRC_PATH", ".tmp/trellis-src")
    _add_source_path("TRELLIS2_SRC_PATH", ".tmp/trellis2-src")


_configure_trellis_imports()

try:
    from trellis2.pipelines import Trellis2ImageTo3DPipeline
    import cumesh
    import o_voxel

    TRELLIS2_AVAILABLE = True
except ImportError:
    TRELLIS2_AVAILABLE = False
    Trellis2ImageTo3DPipeline = None
    cumesh = None
    o_voxel = None

try:
    from trellis.pipelines import TrellisImageTo3DPipeline

    TRELLIS_AVAILABLE = True
except ImportError:
    TRELLIS_AVAILABLE = False
    TrellisImageTo3DPipeline = None


def _estimate_vertex_colors(image: Image.Image, vertex_count: int) -> np.ndarray:
    image_np = np.asarray(image, dtype=np.float32)
    mean_rgb = image_np.reshape(-1, 3).mean(axis=0).clip(0, 255).astype(np.uint8)
    rgba = np.concatenate([mean_rgb, np.array([255], dtype=np.uint8)])
    return np.repeat(rgba[None, :], vertex_count, axis=0)


def _extract_mesh_vertex_colors(mesh, fallback_image: Image.Image) -> np.ndarray:
    vertex_attrs = getattr(mesh, "vertex_attrs", None)
    if vertex_attrs is not None:
        colors = vertex_attrs.detach().cpu().numpy()
        if colors.ndim == 2 and colors.shape[1] >= 3:
            colors = np.clip(colors[:, :3], 0.0, 1.0)
            alpha = np.ones((colors.shape[0], 1), dtype=np.float32)
            rgba = np.concatenate([colors, alpha], axis=1)
            return (rgba * 255).astype(np.uint8)
    return _estimate_vertex_colors(fallback_image, mesh.vertices.shape[0])


def _preprocess_white_background_image(image: Image.Image) -> Image.Image:
    image_np = np.asarray(image.convert("RGB"), dtype=np.uint8)
    lab = cv2.cvtColor(image_np, cv2.COLOR_RGB2LAB)
    border = np.concatenate([lab[:24].reshape(-1, 3), lab[-24:].reshape(-1, 3), lab[:, :24].reshape(-1, 3), lab[:, -24:].reshape(-1, 3)])
    background = np.median(border, axis=0)
    distance = np.linalg.norm(lab.astype(np.float32) - background.astype(np.float32), axis=2)
    mask = (distance > 18).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
    components, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if components > 1:
        largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        mask = np.where(labels == largest, 255, 0).astype(np.uint8)
    if mask.sum() == 0:
        return image

    ys, xs = np.where(mask > 0)
    pad = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * 0.08)
    left = max(int(xs.min()) - pad, 0)
    top = max(int(ys.min()) - pad, 0)
    right = min(int(xs.max()) + pad + 1, image_np.shape[1])
    bottom = min(int(ys.max()) + pad + 1, image_np.shape[0])
    rgba = np.dstack([image_np, cv2.GaussianBlur(mask, (0, 0), 1.5)])
    rgba = rgba[top:bottom, left:right]
    return Image.fromarray(rgba, "RGBA")


def _estimate_foreground_mask(processed: Image.Image) -> np.ndarray:
    image_np = np.asarray(processed)
    if image_np.ndim != 3:
        return np.zeros((1, 1), dtype=bool)

    if image_np.shape[2] >= 4:
        return image_np[:, :, 3] > 12

    rgb = image_np[:, :, :3].astype(np.int16)
    distance_from_white = np.linalg.norm(rgb - 255, axis=2)
    return distance_from_white > 18


def _validate_preprocessed_image_has_foreground(processed: Image.Image, min_foreground_ratio: float, min_foreground_pixels: int) -> None:
    mask = _estimate_foreground_mask(processed)
    foreground_pixels = int(mask.sum())
    total_pixels = int(mask.size) if mask.size else 1
    foreground_ratio = foreground_pixels / max(total_pixels, 1)

    if foreground_pixels < min_foreground_pixels or foreground_ratio < min_foreground_ratio:
        raise ValueError(
            "Khong tim thay object ro rang trong anh tai len. Hay dung anh co mot vat the noi bat, tach khoi nen, truoc khi tao 3D."
        )


class Trellis3DService:
    def __init__(self):
        self.pipeline = None
        self.backend = os.environ.get("TRELLIS_BACKEND", "trellis2").lower()
        self.seed = int(os.environ.get("TRELLIS_SEED", "1"))
        self.ss_steps = int(os.environ.get("TRELLIS_SS_STEPS", "16"))
        self.ss_cfg = float(os.environ.get("TRELLIS_SS_CFG", "7.5"))
        self.slat_steps = int(os.environ.get("TRELLIS_SLAT_STEPS", "16"))
        self.slat_cfg = float(os.environ.get("TRELLIS_SLAT_CFG", "3.0"))
        self.tex_slat_steps = int(os.environ.get("TRELLIS_TEX_SLAT_STEPS", str(self.slat_steps)))
        self.tex_slat_cfg = float(os.environ.get("TRELLIS_TEX_SLAT_CFG", str(self.slat_cfg)))
        self.pipeline_type = os.environ.get("TRELLIS2_PIPELINE_TYPE", "1024_cascade")
        self.max_num_tokens = int(os.environ.get("TRELLIS2_MAX_NUM_TOKENS", "49152"))
        self.decimation_target = int(os.environ.get("TRELLIS2_DECIMATION_TARGET", "300000"))
        self.texture_size = int(os.environ.get("TRELLIS2_TEXTURE_SIZE", "1024"))
        self.trellis2_model_path = os.environ.get("TRELLIS2_MODEL_PATH", "microsoft/TRELLIS.2-4B")
        self.trellis2_config_file = os.environ.get("TRELLIS2_CONFIG_FILE", "pipeline.json")
        self.rembg_session = None
        self.force_rgb = os.environ.get("TRELLIS_FORCE_RGB", "0") != "0"
        self.min_foreground_ratio = float(os.environ.get("TRELLIS_MIN_FOREGROUND_RATIO", "0.015"))
        self.min_foreground_pixels = int(os.environ.get("TRELLIS_MIN_FOREGROUND_PIXELS", "1024"))

        if not torch.cuda.is_available():
            print("CUDA is not available. Running in mock mode.")
            return

        if self.backend == "trellis2" and TRELLIS2_AVAILABLE:
            self.pipeline = Trellis2ImageTo3DPipeline.from_pretrained(
                self.trellis2_model_path,
                config_file=self.trellis2_config_file,
            )
            self.pipeline.cuda()
            return

        if self.backend == "trellis2":
            print("TRELLIS2 is not available. Falling back to legacy TRELLIS.")

        if TRELLIS_AVAILABLE:
            self.backend = "trellis"
            self.pipeline = TrellisImageTo3DPipeline.from_pretrained("microsoft/TRELLIS-image-large")
            self.pipeline.cuda()
        else:
            print("TRELLIS is not available. Running in mock mode.")

    def generate_3d_model(self, image_path: str, output_name: str, extra_metadata: dict[str, Any] | None = None) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        output_dir = os.path.abspath(os.path.join(base_dir, "outputs"))
        os.makedirs(output_dir, exist_ok=True)
        output_file_path = os.path.join(output_dir, f"{output_name}.glb")

        if self.pipeline is None:
            print(f"Mocking 3D generation for {image_path}")
            self._export_mock_glb(image_path, output_file_path)
            self._write_generation_metadata(image_path=image_path, output_file_path=output_file_path, extra_metadata=extra_metadata)
            return output_file_path

        image = Image.open(image_path)
        if self.force_rgb:
            image = image.convert("RGB")

        if self.backend == "trellis2":
            self._generate_with_trellis2(image, output_file_path)
        else:
            self._generate_with_legacy_trellis(image.convert("RGB"), output_file_path)

        self._write_generation_metadata(image_path=image_path, output_file_path=output_file_path, extra_metadata=extra_metadata)
        return output_file_path

    def _write_generation_metadata(self, image_path: str, output_file_path: str, extra_metadata: dict[str, Any] | None = None) -> None:
        metadata_path = Path(output_file_path).with_suffix(".json")
        metadata = {
            "backend": self.backend,
            "model_path": self.trellis2_model_path if self.backend == "trellis2" else "microsoft/TRELLIS-image-large",
            "config_file": self.trellis2_config_file if self.backend == "trellis2" else None,
            "pipeline_type": self.pipeline_type if self.backend == "trellis2" else None,
            "seed": self.seed,
            "ss_steps": self.ss_steps,
            "ss_cfg": self.ss_cfg,
            "slat_steps": self.slat_steps,
            "slat_cfg": self.slat_cfg,
            "tex_slat_steps": self.tex_slat_steps if self.backend == "trellis2" else None,
            "tex_slat_cfg": self.tex_slat_cfg if self.backend == "trellis2" else None,
            "max_num_tokens": self.max_num_tokens if self.backend == "trellis2" else None,
            "decimation_target": self.decimation_target,
            "texture_size": self.texture_size,
            "source_image_name": Path(image_path).name,
        }
        if extra_metadata:
            metadata.update(extra_metadata)
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    def _prepare_trellis2_image(self, image: Image.Image, output_file_path: str) -> Image.Image:
        if getattr(self.pipeline, "rembg_model", None) is not None:
            processed = self.pipeline.preprocess_image(image)
        elif REMBG_AVAILABLE:
            if self.rembg_session is None:
                self.rembg_session = new_session("u2net")
            removed = remove(image, session=self.rembg_session)
            processed = self.pipeline.preprocess_image(removed)
        else:
            processed = self.pipeline.preprocess_image(_preprocess_white_background_image(image))
        _validate_preprocessed_image_has_foreground(processed, self.min_foreground_ratio, self.min_foreground_pixels)
        processed.save(Path(output_file_path).with_name(f"{Path(output_file_path).stem}_trellis2_input.png"))
        return processed

    def _generate_with_trellis2(self, image: Image.Image, output_file_path: str) -> None:
        pipeline_image = self._prepare_trellis2_image(image, output_file_path)
        outputs = self.pipeline.run(
            pipeline_image,
            seed=self.seed,
            preprocess_image=False,
            sparse_structure_sampler_params={
                "steps": self.ss_steps,
                "guidance_strength": self.ss_cfg,
            },
            shape_slat_sampler_params={
                "steps": self.slat_steps,
                "guidance_strength": self.slat_cfg,
            },
            tex_slat_sampler_params={
                "steps": self.tex_slat_steps,
                "guidance_strength": self.tex_slat_cfg,
            },
            pipeline_type=self.pipeline_type,
            max_num_tokens=self.max_num_tokens,
        )
        mesh = outputs[0]
        try:
            glb = o_voxel.postprocess.to_glb(
                vertices=mesh.vertices,
                faces=mesh.faces,
                attr_volume=mesh.attrs,
                coords=mesh.coords,
                attr_layout=mesh.layout,
                voxel_size=mesh.voxel_size,
                aabb=[[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]],
                decimation_target=self.decimation_target,
                texture_size=self.texture_size,
                remesh=True,
                remesh_band=1,
                remesh_project=0,
                use_tqdm=True,
            )
            material = getattr(glb.visual, "material", None)
            texture = getattr(material, "baseColorTexture", None)
            if texture is not None:
                material.baseColorTexture = texture.convert("RGB")
            glb.export(output_file_path)
        except RuntimeError as exc:
            if "nvdiffrast" not in str(exc) and "Rasterize" not in str(exc) and "cudaFuncGetAttributes" not in str(exc):
                raise
            glb = self._export_trellis2_remeshed_preview(mesh)
            glb.export(output_file_path)
        finally:
            torch.cuda.empty_cache()

    def _export_trellis2_remeshed_preview(self, mesh):
        aabb = torch.tensor([[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]], dtype=torch.float32, device=mesh.coords.device)
        grid_size = ((aabb[1] - aabb[0]) / float(mesh.voxel_size)).round().int()
        vertices = mesh.vertices.cuda()
        faces = mesh.faces.cuda()

        cu_mesh = cumesh.CuMesh()
        cu_mesh.init(vertices, faces)
        cu_mesh.fill_holes(max_hole_perimeter=3e-2)
        vertices, faces = cu_mesh.read()
        bvh = cumesh.cuBVH(vertices, faces)

        center = aabb.mean(dim=0)
        scale = (aabb[1] - aabb[0]).max().item()
        resolution = grid_size.max().item()
        cu_mesh.init(*cumesh.remeshing.remesh_narrow_band_dc(
            vertices,
            faces,
            center=center,
            scale=(resolution + 3) / resolution * scale,
            resolution=resolution,
            band=1,
            project_back=0,
            bvh=bvh,
        ))
        cu_mesh.simplify(self.decimation_target)
        cu_mesh.remove_duplicate_faces()
        cu_mesh.repair_non_manifold_edges()
        cu_mesh.remove_small_connected_components(1e-5)
        cu_mesh.fill_holes(max_hole_perimeter=3e-2)
        cu_mesh.unify_face_orientations()
        cu_mesh.compute_vertex_normals()

        vertices, faces = cu_mesh.read()
        normals = cu_mesh.read_vertex_normals()
        vertices_np = vertices.detach().cpu().numpy()
        faces_np = faces.detach().cpu().numpy()
        normals_np = normals.detach().cpu().numpy()
        vertices_np[:, 1], vertices_np[:, 2] = vertices_np[:, 2].copy(), -vertices_np[:, 1].copy()
        normals_np[:, 1], normals_np[:, 2] = normals_np[:, 2].copy(), -normals_np[:, 1].copy()
        vertex_colors = np.tile(np.array([[220, 220, 220, 255]], dtype=np.uint8), (vertices_np.shape[0], 1))
        return trimesh.Trimesh(
            vertices=vertices_np,
            faces=faces_np,
            vertex_normals=normals_np,
            vertex_colors=vertex_colors,
            process=False,
        )

    def _export_mock_glb(self, image_path: str, output_file_path: str) -> None:
        image = Image.open(image_path).convert("RGB")
        image_np = np.asarray(image, dtype=np.float32)
        mean_rgb = image_np.reshape(-1, 3).mean(axis=0).clip(0, 255).astype(np.uint8)
        material = trimesh.visual.material.PBRMaterial(
            baseColorFactor=[int(mean_rgb[0]), int(mean_rgb[1]), int(mean_rgb[2]), 255],
            metallicFactor=0.05,
            roughnessFactor=0.85,
        )
        mesh = trimesh.creation.icosphere(subdivisions=3, radius=0.5)
        mesh.visual = trimesh.visual.TextureVisuals(material=material)
        trimesh.Scene(mesh).export(output_file_path)

    def _generate_with_legacy_trellis(self, image: Image.Image, output_file_path: str) -> None:
        pipeline_image = self.pipeline.preprocess_image(image)
        outputs = self.pipeline.run(
            pipeline_image,
            seed=self.seed,
            formats=["mesh"],
            preprocess_image=False,
            sparse_structure_sampler_params={
                "steps": self.ss_steps,
                "cfg_strength": self.ss_cfg,
            },
            slat_sampler_params={
                "steps": self.slat_steps,
                "cfg_strength": self.slat_cfg,
            },
        )
        mesh = outputs["mesh"][0]
        if not getattr(mesh, "success", False):
            raise RuntimeError("TRELLIS returned an empty mesh")

        vertices = mesh.vertices.detach().cpu().numpy()
        faces = mesh.faces.detach().cpu().numpy()
        vertex_colors = _extract_mesh_vertex_colors(mesh, image)
        vertices = vertices @ np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], dtype=np.float32)
        glb = trimesh.Trimesh(
            vertices=vertices,
            faces=faces,
            vertex_colors=vertex_colors,
            process=False,
        )
        glb.export(output_file_path)
