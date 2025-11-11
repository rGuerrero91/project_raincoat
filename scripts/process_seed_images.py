#!/usr/bin/env python3
"""
Process seed images for the clothing database:
1. Remove backgrounds using U2Net (via rembg)
2. Resize to 800x800 max
3. Save as PNG with transparency

Usage:
    python scripts/process_seed_images.py

The script will automatically install dependencies if missing.
"""

import os
import sys
import subprocess
from pathlib import Path

# Check and install dependencies
def install_dependencies():
    """Install required Python packages if not present."""
    required_packages = {
        'PIL': 'pillow',
        'rembg': 'rembg'
    }

    for module_name, package_name in required_packages.items():
        try:
            __import__(module_name)
        except ImportError:
            print(f"Installing {package_name}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
            print(f"{package_name} installed")
            print()

# Install dependencies before importing
install_dependencies()

from PIL import Image
from rembg import remove

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
PRE_PROCESSED_DIR = PROJECT_ROOT / "raincoat_api" / "db" / "seed_images"/"pre-processed"
PROCESSED_DIR = PROJECT_ROOT / "raincoat_api" / "db" / "seed_images"/"processed"

# Target size
MAX_SIZE = (320, 320)

def process_image(input_path: Path, output_path: Path) -> bool:
    """
    Process a single image: remove background and resize.

    Args:
        input_path: Path to input image
        output_path: Path to save processed image

    Returns:
        True if successful, False otherwise
    """
    try:
        print(f"Processing: {input_path.name}")

        # Load image
        with open(input_path, 'rb') as f:
            input_data = f.read()

        # Remove background
        print("Removing background...")
        output_data = remove(input_data)

        # Load as PIL Image from bytes
        from io import BytesIO
        image = Image.open(BytesIO(output_data))

        # Resize while maintaining aspect ratio
        print(f"Resizing to max {MAX_SIZE[0]}x{MAX_SIZE[1]}...")
        image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

        # Save as PNG with transparency
        image.save(output_path, 'PNG', optimize=True)

        print(f"Saved: {output_path.name}")
        print(f"Size: {image.size[0]}x{image.size[1]}")
        print()

        return True

    except Exception as e:
        print(f"Error: {e}")
        print()
        return False


def main():
    """Main processing function."""
    print("Seed Image Processor")
    print("=" * 50)
    print(f"Source: {PRE_PROCESSED_DIR}")
    print(f"Output: {PROCESSED_DIR}")
    print()

    # Create processed directory
    PROCESSED_DIR.mkdir(exist_ok=True)

    # Expected image files
    expected_images = [
        "blue-cotton-t-shirt",
        "white-button-down-shirt",
        "red-wool-sweater",
        "black-hoodie",
        "dark-wash-jeans",
        "black-dress-pants",
        "khaki-chinos",
        "navy-wool-coat",
        "denim-jacket",
        "white-sneakers",
        "black-dress-shoes",
        "brown-leather-belt",
        "black-wool-beanie",
        "gray-sweatshirt",
        "blue-jeans"
    ]

    # Find all image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']
    image_files = []

    for ext in image_extensions:
        image_files.extend(PRE_PROCESSED_DIR.glob(f'*{ext}'))

    # Filter out processed directory
    image_files = [f for f in image_files]

    if not image_files:
        print("No image files found!")
        print()
        print("Please add images to:")
        print(f"  {PRE_PROCESSED_DIR}")
        print()
        print("Expected filenames:")
        for name in expected_images:
            print(f"  - {name}.jpg")
        sys.exit(1)

    print(f"Found {len(image_files)} images to process")
    print()

    # Process each image
    processed_count = 0
    failed_count = 0

    for image_path in sorted(image_files):
        # Output filename (always .png)
        output_filename = image_path.stem + '.png'
        output_path = PROCESSED_DIR / output_filename

        if process_image(image_path, output_path):
            processed_count += 1
        else:
            failed_count += 1

    # Summary
    print("=" * 50)
    print("Processing complete!")
    print(f"Processed: {processed_count} images")
    if failed_count > 0:
        print(f"Failed: {failed_count} images")
    print()
    print("Next steps:")
    print(f"1. Review processed images in: {PROCESSED_DIR}")
    print("2. If satisfied, move them to: {PRE_PROCESSED_DIR}")
    print("   mv {PROCESSED_DIR}/*.png {PRE_PROCESSED_DIR}/")
    print("3. Update seeds.rb to use .png extension")
    print("4. Run: cd raincoat_api && rails db:seed")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n Fatal error: {e}")
        sys.exit(1)
