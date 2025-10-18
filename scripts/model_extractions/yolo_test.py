"""
Test YOLO Detection on Sample Images
Tests the trained Raincoat YOLOv8n model on clothing images

Usage: python yolo_test.py <image_path>
Example: python yolo_test.py ../../notes_and_test_data/test_images/nike_beanie.jpeg


"""

import sys
from pathlib import Path
import cv2
import numpy as np

def install_dependencies():
    try:
        import onnxruntime
        print("ONNX Runtime found")
    except ImportError:
        print("Installing onnxruntime...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "onnxruntime"])
        import onnxruntime
        print("ONNX Runtime installed")
    
    try:
        import cv2
        print("OpenCV found")
    except ImportError:
        print("Installing opencv-python...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python"])
        print("OpenCV installed")


def preprocess_image(image_path, target_size=640):
    """
    Preprocess image for YOLO inference
    Returns preprocessed tensor and metadata for bbox conversion
    """
    # Read image
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    original_height, original_width = img_rgb.shape[:2]
    
    # Calculate scaling with letterboxing
    scale = min(target_size / original_width, target_size / original_height)
    scaled_width = int(original_width * scale)
    scaled_height = int(original_height * scale)
    
    # Resize image
    img_resized = cv2.resize(img_rgb, (scaled_width, scaled_height))
    
    # Create letterbox canvas
    canvas = np.full((target_size, target_size, 3), 128, dtype=np.uint8)
    
    # Calculate offsets to center image
    offset_x = (target_size - scaled_width) // 2
    offset_y = (target_size - scaled_height) // 2
    
    # Place image on canvas
    canvas[offset_y:offset_y+scaled_height, offset_x:offset_x+scaled_width] = img_resized
    
    # Normalize to [0, 1] and convert to CHW format
    img_normalized = canvas.astype(np.float32) / 255.0
    img_chw = np.transpose(img_normalized, (2, 0, 1))
    img_batch = np.expand_dims(img_chw, axis=0)
    
    return img_batch, img, scale, offset_x, offset_y, original_width, original_height


def postprocess_detections(output, scale, offset_x, offset_y, original_width, original_height,
                          conf_threshold=0.25, iou_threshold=0.45):
    """
    Post-process YOLO output to get bounding boxes
    """
    RAINCOAT_CLASSES = ["top", "bottom", "outerwear", "shoes", "accessories"]
    
    # YOLOv8 output format: [batch, 4+num_classes, 8400]
    # Transpose to [8400, 4+num_classes]
    output = output[0].T  # Remove batch dimension and transpose
    
    detections = []
    
    for detection in output:
        # Get bbox coords (first 4 values)
        x_center, y_center, width, height = detection[:4]
        
        # Get class scores (next 5 values for our 5 classes)
        class_scores = detection[4:9]  # Only 5 classes
        
        # Get best class
        class_id = int(np.argmax(class_scores))
        confidence = float(class_scores[class_id])
        
        if confidence > conf_threshold:
            # Convert from center format to corner format
            x1 = x_center - width / 2
            y1 = y_center - height / 2
            x2 = x_center + width / 2
            y2 = y_center + height / 2
            
            # Convert from letterboxed coords back to original image coords
            x1 = (x1 - offset_x) / scale
            y1 = (y1 - offset_y) / scale
            x2 = (x2 - offset_x) / scale
            y2 = (y2 - offset_y) / scale
            
            # Clamp to image bounds
            x1 = max(0, min(original_width, x1))
            y1 = max(0, min(original_height, y1))
            x2 = max(0, min(original_width, x2))
            y2 = max(0, min(original_height, y2))
            
            detections.append({
                'bbox': [x1, y1, x2, y2],
                'confidence': confidence,
                'class_id': class_id,
                'class_name': RAINCOAT_CLASSES[class_id]
            })
    
    # Apply NMS
    detections = apply_nms(detections, iou_threshold)
    
    return detections


def apply_nms(detections, iou_threshold):
    """Non-Maximum Suppression"""
    if len(detections) == 0:
        return []
    
    # Sort by confidence descending
    detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
    
    keep = []
    suppress = set()
    
    for i in range(len(detections)):
        if i in suppress:
            continue
        
        keep.append(detections[i])
        
        for j in range(i + 1, len(detections)):
            if j in suppress:
                continue
            
            iou = calculate_iou(detections[i]['bbox'], detections[j]['bbox'])
            if iou > iou_threshold:
                suppress.add(j)
    
    return keep


def calculate_iou(box1, box2):
    """Calculate Intersection over Union"""
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    # Intersection
    x1_i = max(x1_1, x1_2)
    y1_i = max(y1_1, y1_2)
    x2_i = min(x2_1, x2_2)
    y2_i = min(y2_1, y2_2)
    
    if x2_i < x1_i or y2_i < y1_i:
        return 0.0
    
    inter_area = (x2_i - x1_i) * (y2_i - y1_i)
    
    # Union
    box1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
    box2_area = (x2_2 - x1_2) * (y2_2 - y1_2)
    union_area = box1_area + box2_area - inter_area
    
    return inter_area / union_area if union_area > 0 else 0.0


def draw_detections(image, detections, output_path):
    """Draw bounding boxes and labels on image"""
    img_draw = image.copy()
    
    COLORS = {
        'top': (255, 0, 0),        # Red
        'bottom': (0, 255, 0),     # Green
        'outerwear': (0, 0, 255),  # Blue
        'shoes': (255, 255, 0),    # Cyan
        'accessories': (255, 0, 255) # Magenta
    }
    
    for det in detections:
        x1, y1, x2, y2 = [int(coord) for coord in det['bbox']]
        class_name = det['class_name']
        confidence = det['confidence']
        
        # Get color for this class
        color = COLORS.get(class_name, (255, 255, 255))
        
        # Draw bbox
        cv2.rectangle(img_draw, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label = f"{class_name}: {confidence:.2f}"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        
        # Draw label background
        cv2.rectangle(img_draw, (x1, y1 - label_size[1] - 10), 
                     (x1 + label_size[0], y1), color, -1)
        
        # Draw label text
        cv2.putText(img_draw, label, (x1, y1 - 5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Save output
    cv2.imwrite(str(output_path), img_draw)
    print(f"\nSaved visualization: {output_path}")


def test_yolo(image_path, model_path="models/raincoat_yolov8n.onnx"):
    """
    Test YOLO model on an image
    """
    import onnxruntime as ort
    
    print("="*60)
    print("Testing Raincoat YOLO Detection")
    print("="*60)
    
    # Check files exist
    image_path = Path(image_path)
    model_path = Path(model_path)
    
    if not image_path.exists():
        print(f"\n✗ Image not found: {image_path}")
        return
    
    if not model_path.exists():
        print(f"\n✗ Model not found: {model_path}")
        print("   Run export script first!")
        return
    
    print(f"\nImage: {image_path}")
    print(f"Model: {model_path}")
    
    # Load ONNX model
    print("\n1. Loading ONNX model...")
    session = ort.InferenceSession(str(model_path))
    input_name = session.get_inputs()[0].name
    print(f"   Model loaded")
    print(f"   Input name: {input_name}")
    
    # Preprocess image
    print("\n2. Preprocessing image...")
    img_tensor, original_img, scale, offset_x, offset_y, orig_w, orig_h = preprocess_image(image_path)
    print(f"   Image preprocessed")
    print(f"   Original size: {orig_w}x{orig_h}")
    print(f"   Scale factor: {scale:.3f}")
    
    # Run inference
    print("\n3. Running inference...")
    outputs = session.run(None, {input_name: img_tensor})
    print(f"   Inference complete")
    print(f"   Output shape: {outputs[0].shape}")
    
    # Post-process detections
    print("\n4. Post-processing detections...")
    detections = postprocess_detections(
        outputs[0], scale, offset_x, offset_y, orig_w, orig_h,
        conf_threshold=0.25, iou_threshold=0.45
    )
    
    print(f"\n   Found {len(detections)} detection(s)")
    
    # Print detections
    if len(detections) > 0:
        print("\n" + "="*60)
        print("Detections")
        print("="*60)
        
        for i, det in enumerate(detections, 1):
            x1, y1, x2, y2 = det['bbox']
            width = x2 - x1
            height = y2 - y1
            area = width * height
            
            print(f"\n{i}. {det['class_name'].upper()}")
            print(f"   Confidence: {det['confidence']:.2%}")
            print(f"   Bbox: [{int(x1)}, {int(y1)}, {int(x2)}, {int(y2)}]")
            print(f"   Size: {int(width)} x {int(height)} ({int(area)} pixels)")
        
        # Find largest detection
        largest = max(detections, key=lambda d: (d['bbox'][2]-d['bbox'][0])*(d['bbox'][3]-d['bbox'][1]))
        print(f"\n→ Largest detection: {largest['class_name']} ({largest['confidence']:.2%})")
        
    else:
        print("\n  No clothing detected above confidence threshold")
        print("   Try lowering confidence threshold or use a different image")
    
    # Draw and save visualization
    output_path = image_path.parent / f"{image_path.stem}_detected{image_path.suffix}"
    draw_detections(original_img, detections, output_path)
    
    print("\n" + "="*60)
    print("Test Complete!")
    print("="*60)
    
    return detections


def main():
    """Main execution"""
    install_dependencies()
    
    if len(sys.argv) < 2:
        print("\nUsage: python test_yolo_detection.py <image_path>")
        print("\nExample:")
        print("  python test_yolo_detection.py test_images/shirt.jpg")
        return 1
    
    image_path = sys.argv[1]
    test_yolo(image_path)
    
    return 0


if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)