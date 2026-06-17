import os
import sys
import argparse
from loguru import logger

from service import ImageEnhancementService

def find_image_pairs(root_dir: str):
    """
    Finds all images in 'images' subdirectories and prepares corresponding output paths.

    Args:
        root_dir (str): The root directory to search in.

    Returns:
        A tuple containing two lists: (input_paths, output_paths)
    """
    input_paths = []
    output_paths = []
    extensions = ('.png', '.jpg', '.jpeg', '.bmp', '.tiff')

    for root, dirs, files in os.walk(root_dir):
        if os.path.basename(root) == 'images':
            enhanced_dir = os.path.join(os.path.dirname(root), "images_enhanced")
            os.makedirs(enhanced_dir, exist_ok=True)

            for file in files:
                if file.lower().endswith(extensions):
                    input_paths.append(os.path.join(root, file))
                    output_paths.append(os.path.join(enhanced_dir, file))
    return input_paths, output_paths

def main():
    """
    Main function to run the image enhancement process from the command line.
    """
    # Configure logger for standalone execution
    logger.remove()
    logger.add(sys.stderr, level="INFO")

    parser = argparse.ArgumentParser(description="Batch enhance images using Real-ESRGAN.")
    parser.add_argument(
        "--input_dir",
        type=str,
        default="/home/ding/debug_mc/material_creator/output",
        help="Root directory containing book outputs to process. The script will look for 'images' subdirectories."
    )
    parser.add_argument(
        "--scale",
        type=int,
        default=4,
        choices=[2, 4, 8],
        help="Upscaling factor for the model."
    )
    parser.add_argument(
        "--preprocess_batch_size",
        type=int,
        default=64,
        help="Batch size for processing patches during enhancement."
    )
    parser.add_argument(
        "--prediction_batch_size",
        type=int,
        default=4,
        help="Batch size for the model prediction on patches (VRAM usage)."
    )
    args = parser.parse_args()

    logger.info("Running ImageEnhancementService...")
    service = ImageEnhancementService(scale=args.scale)

    # --- Process all images in a directory ---
    logger.info(f"\nProcessing all images in the specified input directory: {args.input_dir}")

    if not os.path.isdir(args.input_dir):
        logger.error(f"Input directory not found: {args.input_dir}")
        return

    input_paths, output_paths = find_image_pairs(args.input_dir)

    if input_paths:
        logger.info(f"Found {len(input_paths)} images to enhance in '{args.input_dir}'.")
        service.enhance_batch(
            input_paths,
            output_paths,
            preprocess_batch_size=args.preprocess_batch_size,
            batch_size=args.prediction_batch_size
        )
    else:
        logger.warning(f"No images found in 'images' subdirectories within '{args.input_dir}'.")

if __name__ == '__main__':
    main()
