import os
import sys
from PIL import Image
import numpy as np
import torch
from loguru import logger
from tqdm import tqdm

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "../../../"))
REAL_ESRGAN_DIR = os.path.join(PROJECT_ROOT, "Real-ESRGAN")
if REAL_ESRGAN_DIR not in sys.path:
    sys.path.append(REAL_ESRGAN_DIR)

from RealESRGAN import RealESRGAN
from typing import List
from RealESRGAN.utils import pad_reflect, split_image_into_overlapping_patches, stich_together, \
                   unpad_image

class ImageEnhancementService:
    """
    A service to enhance image resolution using Real-ESRGAN.
    """
    def __init__(self, scale: int = 2, custom_model_path: str = None):
        """
        Initializes the Real-ESRGAN model.
        Args:
            scale (int): The upscaling factor (e.g., 2, 4, 8).
            custom_model_path (str): Optional path to a custom Real-ESRGAN checkpoint.
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Initializing ImageEnhancementService on device: {self.device}")
        
        self.scale = scale
        
        if custom_model_path:
            weights_path = custom_model_path
            download = False
            logger.info(f"Using custom model path: {weights_path}")
        else:
            # Create a 'weights' directory inside the current module's directory (`src/modules/gen`)
            # to store the model weights.
            weights_file = f'RealESRGAN_x{self.scale}.pth'
            weights_dir = os.path.join(CURRENT_DIR, "weights")
            os.makedirs(weights_dir, exist_ok=True)
            weights_path = os.path.join(weights_dir, weights_file)
            download = True

        self.model = RealESRGAN(self.device, scale=self.scale)
        logger.info(f"Loading weights from: {weights_path}")
        self.model.load_weights(weights_path, download=download)
        logger.info("Model loaded successfully.")

    def enhance(self, image_path: str, output_path: str):
        """
        Enhances a single image and saves the result.
        Args:
            image_path (str): Path to the input image.
            output_path (str): Path to save the enhanced image.
        """
        try:
            logger.info(f"Processing image: {image_path}")
            image = Image.open(image_path).convert('RGB')
            sr_image = self.model.predict(image)
            
            output_dir = os.path.dirname(output_path)
            os.makedirs(output_dir, exist_ok=True)
                
            sr_image.save(output_path)
            logger.success(f"Enhanced image saved to: {output_path}")
        except Exception as e:
            logger.error(f"Failed to enhance image {image_path}. Error: {e}")

    def _predict_patches(self, patches_tensor: torch.Tensor, batch_size: int) -> np.ndarray:
        """Runs the model on a tensor of patches and returns the super-resolution patches."""
        all_sr_patches = []
        with torch.no_grad(), torch.cuda.amp.autocast():
            for i in tqdm(range(0, patches_tensor.shape[0], batch_size), desc="  Predicting patches", leave=False):
                batch_sr = self.model.model(patches_tensor[i:i + batch_size])
                all_sr_patches.append(batch_sr)
        
        sr_patches_tensor = torch.cat(all_sr_patches, 0)
        return sr_patches_tensor.permute((0, 2, 3, 1)).clamp_(0, 1).cpu().numpy()

    def enhance_batch(self, 
                      image_paths: List[str], 
                      output_paths: List[str],
                      batch_size=4,
                      preprocess_batch_size=64,
                      patches_size=192,
                      padding=24,
                      pad_size=15):
        """
        Enhances a batch of images by processing them in chunks to balance performance and memory usage.
        Args:
            image_paths (List[str]): List of paths to the input images.
            output_paths (List[str]): List of paths to save the enhanced images.
            batch_size (int): Batch size for model prediction on patches.
            preprocess_batch_size (int): Number of images to preprocess and hold in memory at once.
            patches_size (int): Size of the image patches.
            padding (int): Overlap between patches.
            pad_size (int): Padding for the whole image.
        """
        if len(image_paths) != len(output_paths):
            raise ValueError("Input and output path lists must have the same length.")

        logger.info(f"Starting enhancement for {len(image_paths)} images.")

        total_batches = (len(image_paths) + preprocess_batch_size - 1) // preprocess_batch_size

        for i in tqdm(range(0, len(image_paths), preprocess_batch_size), desc="Enhancing image chunks", total=total_batches):
            image_batch_paths = image_paths[i:i + preprocess_batch_size]
            output_batch_paths = output_paths[i:i + preprocess_batch_size]
            
            logger.info(f"Processing image chunk {i // preprocess_batch_size + 1}/{total_batches} ({len(image_batch_paths)} images)...")

            all_patches_for_concat = []
            reconstruction_info = []

            # 1. Pre-process all images in the current chunk and collect patches
            for image_path in image_batch_paths:
                try:
                    image = Image.open(image_path).convert('RGB')
                    lr_image = np.array(image)
                    
                    lr_image = pad_reflect(lr_image, pad_size)
                    patches, p_shape = split_image_into_overlapping_patches(
                        lr_image, patch_size=patches_size, padding_size=padding
                    )
                    
                    all_patches_for_concat.append(patches)
                    
                    scaled_image_shape = tuple(np.multiply(lr_image.shape[0:2], self.scale)) + (3,)
                    padded_size_scaled = tuple(np.multiply(p_shape[0:2], self.scale)) + (3,)
                    
                    reconstruction_info.append({
                        'num_patches': len(patches),
                        'padded_size_scaled': padded_size_scaled,
                        'scaled_image_shape': scaled_image_shape,
                    })
                except Exception as e:
                    logger.error(f"Failed to preprocess image {image_path}. Error: {e}")
                    reconstruction_info.append(None) # Placeholder for failed images

            if not all_patches_for_concat:
                logger.warning("No images were successfully preprocessed in this chunk. Skipping.")
                continue

            # 2. Run model on all patches from the current chunk
            patches_tensor = torch.FloatTensor(np.concatenate(all_patches_for_concat) / 255).permute((0, 3, 1, 2)).to(self.device).detach()
            sr_patches_np = self._predict_patches(patches_tensor, batch_size)

            # 3. Reconstruct and save each image in the current chunk
            current_patch_idx = 0
            for k, info in enumerate(reconstruction_info):
                if info is None:
                    continue

                try:
                    num_patches = info['num_patches']
                    image_sr_patches = sr_patches_np[current_patch_idx : current_patch_idx + num_patches]
                    current_patch_idx += num_patches

                    np_sr_image = stich_together(image_sr_patches, padded_image_shape=info['padded_size_scaled'], target_shape=info['scaled_image_shape'], padding_size=padding * self.scale)
                    sr_img_np = (np_sr_image * 255).astype(np.uint8)
                    sr_img_np = unpad_image(sr_img_np, pad_size * self.scale)
                    sr_image = Image.fromarray(sr_img_np)

                    output_path = output_batch_paths[k]
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    sr_image.save(output_path)
                    logger.success(f"Enhanced image saved to: {output_path}")
                except Exception as e:
                    logger.error(f"Failed to reconstruct or save image for {image_batch_paths[k]}. Error: {e}")

        logger.success("Batch enhancement finished.")
