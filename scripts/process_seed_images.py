#!/usr/bin/env python3
"""
Process seed images for the clothing database:
1. Detect clothing item using YOLO and crop to bounding box
2. Resize to 320x320 max (reduces compute for next step)
3. Remove backgrounds using U2Net (via rembg)
4. Save as PNG with transparency

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
        'rembg': 'rembg',
        'numpy': 'numpy',
        'cv2': 'opencv-python',
        'onnxruntime': 'onnxruntime'
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
import numpy as np
import cv2
import onnxruntime as ort

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
PRE_PROCESSED_DIR = PROJECT_ROOT / "raincoat_api" / "db" / "seed_images"/"pre-processed"
PROCESSED_DIR = PROJECT_ROOT / "raincoat_api" / "db" / "seed_images"/"processed"
YOLO_MODEL_PATH = PROJECT_ROOT / "raincoat_api" / "public" / "models" / "yolo_raincoat.onnx"

# Target size
MAX_SIZE = (320, 320)

# YOLO categories
YOLO_CATEGORIES = {
    0: "top",
    1: "bottom",
    2: "outerwear",
    3: "shoes",
    4: "accessories"
}

class YOLODetector:
    """YOLO-based clothing detector for cropping to bounding box"""

    def __init__(self, model_path: Path, conf_threshold: float = 0.25, iou_threshold: float = 0.45):
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold

        if not model_path.exists():
            raise FileNotFoundError(f"YOLO model not found: {model_path}")

        # Load ONNX model
        self.session = ort.InferenceSession(str(model_path))
        self.input_name = self.session.get_inputs()[0].name
        self.input_shape = self.session.get_inputs()[0].shape  # [1, 3, 640, 640]

    def preprocess(self, image: np.ndarray) -> tuple[np.ndarray, dict]:
        """
        Preprocess image for YOLO inference with letterboxing.

        Returns:
            Preprocessed image tensor and metadata dict with scale and offsets
        """
        # Get original dimensions
        orig_h, orig_w = image.shape[:2]

        # Target size (640x640)
        target_size = 640

        # Calculate scale to fit image in 640x640 while maintaining aspect ratio
        scale = min(target_size / orig_w, target_size / orig_h)

        # Calculate new dimensions
        new_w = int(orig_w * scale)
        new_h = int(orig_h * scale)

        # Resize image
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        # Create letterboxed image (centered on gray canvas)
        letterboxed = np.full((target_size, target_size, 3), 128, dtype=np.uint8)  # Gray = 128

        # Calculate padding to center the image
        offset_x = (target_size - new_w) // 2
        offset_y = (target_size - new_h) // 2

        # Place resized image on canvas
        letterboxed[offset_y:offset_y + new_h, offset_x:offset_x + new_w] = resized

        # Convert to RGB and normalize to [0, 1]
        letterboxed = cv2.cvtColor(letterboxed, cv2.COLOR_BGR2RGB)
        letterboxed = letterboxed.astype(np.float32) / 255.0

        # Transpose to CHW format and add batch dimension
        letterboxed = letterboxed.transpose(2, 0, 1)  # HWC -> CHW
        letterboxed = np.expand_dims(letterboxed, axis=0)  # Add batch dimension

        metadata = {
            'scale': scale,
            'offset_x': offset_x,
            'offset_y': offset_y,
            'original_width': orig_w,
            'original_height': orig_h
        }

        return letterboxed, metadata

    def detect(self, image: np.ndarray) -> list[dict]:
        """
        Detect clothing items in image.

        Args:
            image: BGR image from cv2

        Returns:
            List of detections with format:
            [{'bbox': [x1, y1, x2, y2], 'confidence': float, 'category': str}, ...]
        """
        # Preprocess
        input_tensor, metadata = self.preprocess(image)

        # Run inference
        outputs = self.session.run(None, {self.input_name: input_tensor})
        predictions = outputs[0]  # Shape: [1, 84, 8400] for YOLOv8

        # Transpose to [1, 8400, 84]
        predictions = predictions.transpose(0, 2, 1)

        # Process detections
        detections = []
        for detection in predictions[0]:  # Iterate over 8400 predictions
            # Extract boxes and scores
            x_center, y_center, width, height = detection[:4]
            class_scores = detection[4:9]  # First 5 class scores (our categories)

            # Get best class
            class_id = np.argmax(class_scores)
            confidence = class_scores[class_id]

            # Filter by confidence
            if confidence < self.conf_threshold:
                continue

            # Convert from center format to corner format (still in 640x640 space)
            x1 = x_center - width / 2
            y1 = y_center - height / 2
            x2 = x_center + width / 2
            y2 = y_center + height / 2

            # Convert from model space (640x640) to original image space
            # Step 1: Remove letterbox offset
            # Step 2: Undo scaling
            scale = metadata['scale']
            offset_x = metadata['offset_x']
            offset_y = metadata['offset_y']
            orig_w = metadata['original_width']
            orig_h = metadata['original_height']

            x1 = (x1 - offset_x) / scale
            y1 = (y1 - offset_y) / scale
            x2 = (x2 - offset_x) / scale
            y2 = (y2 - offset_y) / scale

            # Clamp to image bounds
            x1 = max(0, min(int(x1), orig_w))
            y1 = max(0, min(int(y1), orig_h))
            x2 = max(0, min(int(x2), orig_w))
            y2 = max(0, min(int(y2), orig_h))

            detections.append({
                'bbox': [x1, y1, x2, y2],
                'confidence': float(confidence),
                'category': YOLO_CATEGORIES.get(int(class_id), 'unknown'),
                'class_id': int(class_id)
            })

        # Apply NMS (Non-Maximum Suppression)
        detections = self.nms(detections)

        return detections

    def nms(self, detections: list[dict]) -> list[dict]:
        """Apply Non-Maximum Suppression to remove overlapping boxes"""
        if not detections:
            return []

        # Sort by confidence
        detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)

        keep = []
        while detections:
            # Keep highest confidence detection
            best = detections.pop(0)
            keep.append(best)

            # Remove overlapping detections
            detections = [
                d for d in detections
                if self.iou(best['bbox'], d['bbox']) < self.iou_threshold
            ]

        return keep

    def iou(self, box1: list, box2: list) -> float:
        """Calculate Intersection over Union"""
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2

        # Calculate intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)

        if x2_i < x1_i or y2_i < y1_i:
            return 0.0

        intersection = (x2_i - x1_i) * (y2_i - y1_i)

        # Calculate union
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

def process_image(input_path: Path, output_path: Path, detector: YOLODetector) -> bool:
    """
    Process a single image: detect with YOLO, crop, resize, then remove background.

    Args:
        input_path: Path to input image
        output_path: Path to save processed image
        detector: YOLODetector instance

    Returns:
        True if successful, False otherwise
    """
    try:
        print(f"Processing: {input_path.name}")

        # Load image with cv2 for YOLO detection
        image_cv2 = cv2.imread(str(input_path))
        if image_cv2 is None:
            raise ValueError(f"Failed to load image: {input_path}")

        # Detect clothing items with YOLO
        print("Detecting clothing item...")
        detections = detector.detect(image_cv2)

        if not detections:
            print("  ⚠️  No clothing detected, processing entire image")
            cropped_image = image_cv2
        else:
            # Use the highest confidence detection
            best_detection = detections[0]
            print(f"  ✓ Detected {best_detection['category']} (confidence: {best_detection['confidence']:.2f})")

            # Crop to bounding box with padding
            x1, y1, x2, y2 = best_detection['bbox']

            # Add 10% padding
            width = x2 - x1
            height = y2 - y1
            padding_x = int(width * 0.1)
            padding_y = int(height * 0.1)

            # Apply padding with bounds checking
            img_h, img_w = image_cv2.shape[:2]
            x1 = max(0, x1 - padding_x)
            y1 = max(0, y1 - padding_y)
            x2 = min(img_w, x2 + padding_x)
            y2 = min(img_h, y2 + padding_y)

            cropped_image = image_cv2[y1:y2, x1:x2]
            print(f"  Cropped to bbox: [{x1}, {y1}, {x2}, {y2}]")

        # Convert to PIL Image for resizing
        from io import BytesIO
        cropped_rgb = cv2.cvtColor(cropped_image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(cropped_rgb)

        # Resize while maintaining aspect ratio BEFORE background removal
        print(f"Resizing to max {MAX_SIZE[0]}x{MAX_SIZE[1]}...")
        pil_image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
        print(f"  Resized to: {pil_image.size[0]}x{pil_image.size[1]}")

        # Convert resized image to bytes for rembg
        img_byte_arr = BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        input_data = img_byte_arr.getvalue()

        # Remove background (now on smaller image)
        print("Removing background...")
        output_data = remove(input_data)

        # Load final image
        final_image = Image.open(BytesIO(output_data))

        # Save as PNG with transparency
        final_image.save(output_path, 'PNG', optimize=True)

        print(f"✓ Saved: {output_path.name}")
        print(f"  Final size: {final_image.size[0]}x{final_image.size[1]}")
        print()

        return True

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        print()
        return False


def main():
    """Main processing function."""
    print("Seed Image Processor with YOLO Detection")
    print("=" * 50)
    print(f"Source: {PRE_PROCESSED_DIR}")
    print(f"Output: {PROCESSED_DIR}")
    print(f"YOLO Model: {YOLO_MODEL_PATH}")
    print()

    # Create processed directory
    PROCESSED_DIR.mkdir(exist_ok=True)

    # Initialize YOLO detector
    print("Loading YOLO detector...")
    try:
        detector = YOLODetector(YOLO_MODEL_PATH)
        print("✓ YOLO detector loaded successfully")
        print()
    except Exception as e:
        print(f"✗ Failed to load YOLO detector: {e}")
        print("Proceeding without YOLO detection (will process entire images)")
        detector = None
        print()

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

        if detector:
            if process_image(image_path, output_path, detector):
                processed_count += 1
            else:
                failed_count += 1
        else:
            # Fallback to basic processing without YOLO
            print(f"⚠️  Processing {image_path.name} without YOLO detection")
            failed_count += 1

    # Summary
    print("=" * 50)
    print("Processing complete!")
    print(f"✓ Processed: {processed_count} images")
    if failed_count > 0:
        print(f"✗ Failed: {failed_count} images")
    print()
    print("Next steps:")
    print(f"1. Review processed images in: {PROCESSED_DIR}")
    print(f"2. Images are now cropped to detected clothing items")
    print(f"3. Update seeds.rb image_mapping with new filenames")
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
