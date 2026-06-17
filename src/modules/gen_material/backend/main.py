import os
from pathlib import Path
import sys
import json
from dotenv import load_dotenv

backend_root = os.path.dirname(os.path.abspath(__file__))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime, timezone

import shutil
import uuid
import re
from PIL import Image

from app.services.image_service import GeminiImageService
from app.services.trellis_service import Trellis3DService

app = FastAPI(title="Material Creator - 3D AI Backend")

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from the outputs directory
outputs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "outputs"))
os.makedirs(outputs_dir, exist_ok=True)
app.mount("/assets", StaticFiles(directory=outputs_dir, html=False), name="assets")
backend_public_base_url = os.environ.get("BACKEND_PUBLIC_BASE_URL", "http://127.0.0.1:8006").rstrip("/")

# Initialize Services
# Keep heavy services lazy so server can boot for world endpoints.
image_service = None
trellis_service = None
image_enhancement_service = None

# In-memory store for sessions mapping session_id -> scene_data
sessions: Dict[str, Dict[str, Any]] = {}

class SceneRequest(BaseModel):
    prompt: str

class SceneResponse(BaseModel):
    session_id: str
    scene_data: dict

class DirectUpload3DResponse(BaseModel):
    session_id: str
    glb_path: str
    scene_data: dict

class ImageRequest(BaseModel):
    session_id: str
    object_id: str

class ImageResponse(BaseModel):
    image_url: str

class Model3DRequest(BaseModel):
    session_id: str
    object_id: str
    enhance_mode: str = "auto"

class Model3DResponse(BaseModel):
    glb_path: str
    scene_data: dict

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def find_scene_object(scene_data: Dict[str, Any], object_id: str):
    for obj in scene_data.get("objects", []):
        if str(obj.get("id")) == str(object_id):
            return obj
    return None


def build_static_asset_url(file_path: str) -> str:
    cache_buster = int(os.path.getmtime(file_path))
    relative_path = Path(file_path).resolve().relative_to(Path(outputs_dir).resolve()).as_posix()
    return f"/assets/{relative_path}?v={cache_buster}"


def build_public_asset_url(file_path: str) -> str:
    return f"{backend_public_base_url}{build_static_asset_url(file_path)}"


def format_library_label(stem: str) -> str:
    cleaned = re.sub(r"[_-]+", " ", stem).strip()
    return cleaned or stem


def find_preview_image_for_glb(glb_path: str) -> str | None:
    stem = Path(glb_path).stem
    candidates = []
    for extension in (".png", ".jpg", ".jpeg", ".webp"):
        candidates.append(os.path.join(outputs_dir, f"{stem}_img{extension}"))
        candidates.append(os.path.join(outputs_dir, f"{stem}{extension}"))

    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate

    return None


def normalize_enhance_mode(enhance_mode: str | None) -> str:
    normalized = (enhance_mode or "auto").strip().lower()
    if normalized in {"true", "yes", "1"}:
        return "on"
    if normalized in {"false", "no", "0"}:
        return "off"
    if normalized not in {"auto", "on", "off"}:
        raise HTTPException(status_code=400, detail="enhance_mode must be auto, on, or off.")
    return normalized


def should_auto_enhance_image(image_path: str) -> bool:
    with Image.open(image_path) as image:
        width, height = image.size
    threshold = int(os.environ.get("REALESRGAN_AUTO_MIN_SIDE", "768"))
    return min(width, height) < threshold


def get_image_enhancement_service():
    global image_enhancement_service
    if image_enhancement_service is None:
        gen_img_path = str(Path(__file__).resolve().parents[2] / "gen_img")
        if gen_img_path not in sys.path:
            sys.path.insert(0, gen_img_path)
        from service import ImageEnhancementService

        scale = int(os.environ.get("REALESRGAN_SCALE", "2"))
        custom_model_path = os.environ.get("REALESRGAN_MODEL_PATH") or None
        image_enhancement_service = ImageEnhancementService(scale=scale, custom_model_path=custom_model_path)
    return image_enhancement_service


def prepare_trellis_image(image_path: str, output_name: str, enhance_mode: str | None) -> tuple[str, Dict[str, Any]]:
    normalized_mode = normalize_enhance_mode(enhance_mode)
    apply_enhance = normalized_mode == "on" or (normalized_mode == "auto" and should_auto_enhance_image(image_path))
    metadata: Dict[str, Any] = {
        "image_enhance_mode": normalized_mode,
        "image_enhance_applied": False,
        "original_image_name": Path(image_path).name,
    }

    if not apply_enhance:
        return image_path, metadata

    enhanced_path = os.path.join(outputs_dir, f"{output_name}_realesrgan_x{os.environ.get('REALESRGAN_SCALE', '2')}_{uuid.uuid4().hex}.png")
    service = get_image_enhancement_service()
    service.enhance(image_path, enhanced_path)
    if not os.path.exists(enhanced_path):
        if normalized_mode == "on":
            raise RuntimeError("RealESRGAN enhancement failed before TRELLIS generation.")
        metadata["image_enhance_error"] = "RealESRGAN enhancement failed; used original image."
        return image_path, metadata

    metadata.update({
        "image_enhance_applied": True,
        "enhancer": "RealESRGAN",
        "enhancer_scale": getattr(service, "scale", int(os.environ.get("REALESRGAN_SCALE", "2"))),
        "enhanced_image_name": Path(enhanced_path).name,
        "enhanced_image_url": build_static_asset_url(enhanced_path),
    })
    return enhanced_path, metadata


def build_local_library_item(glb_path: str) -> Dict[str, Any]:
    stat = os.stat(glb_path)
    stem = Path(glb_path).stem
    preview_image = find_preview_image_for_glb(glb_path)
    metadata_path = Path(glb_path).with_suffix(".json")
    metadata: Dict[str, Any] = {}
    modified_at = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()

    if metadata_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception:
            metadata = {}

    return {
        "id": stem,
        "library_id": f"disk:{stem}",
        "label": format_library_label(stem),
        "model_url": build_static_asset_url(glb_path),
        "image_url": build_static_asset_url(preview_image) if preview_image else None,
        "file_name": os.path.basename(glb_path),
        "modified_at": modified_at,
        "source": "disk",
        "metadata": metadata,
    }


def validate_image_upload(file: UploadFile) -> str:
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image format. Please upload PNG, JPG, JPEG, or WEBP.")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    return extension


def save_uploaded_image(file: UploadFile, session_id: str, object_id: str) -> str:
    extension = validate_image_upload(file)
    file_name = f"uploaded_{session_id}_{object_id}_{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(outputs_dir, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path


def build_direct_upload_scene(session_id: str, object_id: str, image_path: str) -> Dict[str, Any]:
    scene_data = {
        "id": f"generated-upload-{session_id}",
        "theme": "Mô hình 3D từ ảnh có sẵn",
        "allowDissolve": False,
        "particleColor": "#38bdf8",
        "environment": "museumFocus",
        "sceneStyle": "galleryLight",
        "backgroundColor": "#e8eef5",
        "floorColor": "#e7e5e4",
        "pedestalColor": "#fafbfd",
        "accentColor": "#38bdf8",
        "secondaryAccentColor": "#64748b",
        "character": {
            "name": "Trợ giảng 3D AI",
            "voice_id": "vi-VN",
            "animation": "idle",
        },
        "interactions": [
            {
                "trigger": "start",
                "action": "speak",
                "text": "Đây là mô hình 3D được tạo trực tiếp từ ảnh bạn đã tải lên."
            }
        ],
        "objects": [
            {
                "id": object_id,
                "type": "generatedModel",
                "position": [0, 0.78, 0],
                "scale": [1.8, 1.8, 1.8],
                "rotation": [0, 0, 0],
                "displayMode": "museumFocus",
                "interactable": True,
                "title": "Mô hình 3D từ ảnh tải lên",
                "description": "Mô hình này được tạo trực tiếp từ ảnh người dùng cung cấp.",
                "info": "Bạn có thể xoay, zoom và bấm vào mô hình để xem thông tin chi tiết.",
                "image_path": image_path,
                "image_url": build_static_asset_url(image_path),
            }
        ]
    }
    return scene_data


@app.get("/library_3d")
async def list_local_3d_library():
    try:
        items = []
        for glb_path in sorted(Path(outputs_dir).glob("*.glb"), key=lambda p: p.stat().st_mtime, reverse=True):
            items.append(build_local_library_item(str(glb_path)))
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_3d_from_upload", response_model=DirectUpload3DResponse)
async def generate_3d_from_upload(
    file: UploadFile = File(...),
    object_id: str = Form("uploaded_object"),
    enhance_mode: str = Form("auto")
):
    session_id = str(uuid.uuid4())
    try:
        image_path = save_uploaded_image(file, session_id, object_id)
        scene_data = build_direct_upload_scene(session_id, object_id, image_path)
        obj = scene_data["objects"][0]

        print(f"Generating 3D Model for uploaded image using Trellis: {object_id}...")
        trellis_image_path, enhance_metadata = prepare_trellis_image(image_path, object_id, enhance_mode)

        global trellis_service
        if trellis_service is None:
            trellis_service = Trellis3DService()

        glb_path = trellis_service.generate_3d_model(
            image_path=trellis_image_path,
            output_name=object_id,
            extra_metadata=enhance_metadata,
        )
        print(f"3D Model generated at: {glb_path}")

        obj["model_url"] = build_static_asset_url(glb_path)
        obj["generation_metadata"] = build_local_library_item(glb_path).get("metadata", {})
        scene_data["libraryId"] = f"disk:{Path(glb_path).stem}"
        scene_data["libraryLabel"] = format_library_label(Path(glb_path).stem)
        scene_data["librarySource"] = "disk"
        scene_data["generation_metadata"] = obj["generation_metadata"]
        sessions[session_id] = scene_data

        return DirectUpload3DResponse(
            session_id=session_id,
            glb_path=obj["model_url"],
            scene_data=scene_data
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()


@app.post("/upload_image", response_model=ImageResponse)
async def upload_image(
    session_id: str = Form(...),
    object_id: str = Form(...),
    file: UploadFile = File(...)
):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    scene_data = sessions[session_id]
    obj = find_scene_object(scene_data, object_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Object ID not found in scene")

    try:
        image_path = save_uploaded_image(file, session_id, object_id)
        obj["image_path"] = image_path
        obj["image_url"] = build_static_asset_url(image_path)
        return ImageResponse(image_url=obj["image_url"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()


@app.post("/generate_scene", response_model=SceneResponse)
async def generate_scene(req: SceneRequest):
    """
    Step 1: Calls LLM service to get JSON Scene Schema and Image Prompts.
    Returns scene_data and a session_id for subsequent requests.
    """
    try:
        print(f"Step 1: Generating Scene Data from Prompt: '{req.prompt}'")
        from app.services.llm_service import AzureLLMService
        llm_service = AzureLLMService()
        scene_data = llm_service.generate_scene(req.prompt)
        
        session_id = str(uuid.uuid4())
        sessions[session_id] = scene_data
        
        return SceneResponse(
            session_id=session_id,
            scene_data=scene_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_image", response_model=ImageResponse)
async def generate_image(req: ImageRequest):
    """
    Step 2: Takes session_id and object_id. Calls Image Gen service.
    Returns the generated 2D image URL/path for human-in-the-loop confirmation.
    """
    if req.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    scene_data = sessions[req.session_id]
    obj = find_scene_object(scene_data, req.object_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Object ID not found in scene")

    if "image_prompt" not in obj or not obj["image_prompt"]:
        raise HTTPException(status_code=400, detail="No image prompt found for this object")

    try:
        print(f"Generating Image for {req.object_id}...")
        global image_service
        if image_service is None:
            image_service = GeminiImageService()

        img_path = image_service.generate_image(prompt=obj["image_prompt"], output_name=f"{req.object_id}_img")
        print(f"Image generated at: {img_path}")

        obj["image_path"] = img_path
        obj["image_url"] = build_static_asset_url(img_path)

        return ImageResponse(image_url=obj["image_url"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_3d", response_model=Model3DResponse)
async def generate_3d(req: Model3DRequest):
    """
    Step 3: Takes session_id and object_id AFTER user confirmed the image.
    Calls Trellis service, updates scene data, and returns the final 3D model path.
    """
    if req.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    scene_data = sessions[req.session_id]
    obj = find_scene_object(scene_data, req.object_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Object ID not found in scene")

    if "image_path" not in obj:
        raise HTTPException(status_code=400, detail="Image not available yet for this object. Please call /generate_image or /upload_image first.")

    try:
        print(f"Generating 3D Model for {req.object_id} using Trellis...")
        trellis_image_path, enhance_metadata = prepare_trellis_image(obj["image_path"], req.object_id, req.enhance_mode)

        global trellis_service
        if trellis_service is None:
            trellis_service = Trellis3DService()

        glb_path = trellis_service.generate_3d_model(
            image_path=trellis_image_path,
            output_name=f"{req.object_id}",
            extra_metadata=enhance_metadata,
        )
        print(f"3D Model generated at: {glb_path}")

        obj["model_url"] = build_static_asset_url(glb_path)
        obj["generation_metadata"] = build_local_library_item(glb_path).get("metadata", {})
        scene_data["libraryId"] = f"disk:{Path(glb_path).stem}"
        scene_data["libraryLabel"] = format_library_label(Path(glb_path).stem)
        scene_data["librarySource"] = "disk"
        scene_data["generation_metadata"] = obj["generation_metadata"]

        return Model3DResponse(glb_path=obj["model_url"], scene_data=scene_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
