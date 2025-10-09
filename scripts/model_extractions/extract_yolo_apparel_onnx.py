"""
YOLO Apparel Detection Model Extraction
Exports YOLOv8n to ONNX format with apparel-focused class filtering
Optimized for client-side inference in browser
"""

import os
from pathlib import Path
import json
import numpy as np

def export_yolov8_apparel():
    """
    Export YOLOv8n model to ONNX format optimized for apparel detection.
    YOLOv8n is the smallest/fastest variant (~6MB) suitable for browser inference.
    """
    try:
        from ultralytics import YOLO
        print("✓ Ultralytics library found")
    except ImportError:
        print("✗ Installing ultralytics...")
        import subprocess
        subprocess.check_call(["pip", "install", "ultralytics"])
        from ultralytics import YOLO
        print("✓ Ultralytics installed")
    
    # Create output directory
    output_dir = Path("models")
    output_dir.mkdir(exist_ok=True)
    
    print("\n" + "="*60)
    print("YOLO Apparel Detection Model Export")
    print("="*60)
    
    # Load YOLOv8n (nano) - smallest and fastest model
    print("\n1. Loading YOLOv8n model...")
    model = YOLO("yolov8n.pt")  # Automatically downloads if not present
    print(f"   Model size: ~6MB")
    print(f"   Architecture: YOLOv8n (nano)")
    
    # COCO dataset classes that are apparel-related
    # COCO class IDs: https://tech.amikelive.com/node-718/what-object-categories-labels-are-in-coco-dataset/
    apparel_classes = {
        24: "backpack",
        25: "umbrella",
        26: "handbag",
        27: "tie",
        28: "suitcase",
        # Note: COCO doesn't have detailed clothing classes
        # For production, consider fine-tuning on fashion datasets like:
        # - DeepFashion2
        # - Fashion-MNIST
        # - iMaterialist Fashion
    }
    
    print(f"\n2. COCO Apparel Classes (limited):")
    for class_id, class_name in apparel_classes.items():
        print(f"   [{class_id}] {class_name}")
    
    print("\n   Note: COCO has limited clothing classes.")
    print("   For production, consider fine-tuning on fashion datasets:")
    print("   - DeepFashion2 (detailed clothing categories)")
    print("   - iMaterialist Fashion (fine-grained attributes)")
    
    # Export to ONNX format
    print("\n3. Exporting to ONNX format...")
    onnx_path = output_dir / "yolov8n.onnx"
    
    # Export with optimizations for browser inference
    model.export(
        format="onnx",
        imgsz=640,  # Standard YOLO input size
        simplify=True,  # Simplify model for better compatibility
        opset=14,  # ONNX opset version (compatible with ONNX Runtime Web)
        dynamic=False,  # Fixed input size for better optimization
    )
    
    # Move the exported file to our models directory
    exported_file = Path("yolov8n.onnx")
    if exported_file.exists():
        exported_file.rename(onnx_path)
        print(f"   ✓ Exported to: {onnx_path}")
        print(f"   File size: {onnx_path.stat().st_size / (1024*1024):.2f} MB")
    
    # Create apparel class filter configuration
    class_filter = {
        "description": "COCO classes filtered for apparel detection",
        "model": "yolov8n",
        "input_size": [640, 640],
        "apparel_class_ids": list(apparel_classes.keys()),
        "class_names": apparel_classes,
        "confidence_threshold": 0.25,
        "iou_threshold": 0.45,
        "note": "COCO has limited clothing classes. Consider fine-tuning on fashion datasets for production."
    }
    
    filter_path = output_dir / "yolo_apparel_classes.json"
    with open(filter_path, "w") as f:
        json.dump(class_filter, f, indent=2)
    print(f"   ✓ Class filter saved to: {filter_path}")
    
    # Create detection configuration for client-side use
    detection_config = {
        "model_info": {
            "name": "YOLOv8n",
            "type": "object_detection",
            "input_shape": [1, 3, 640, 640],
            "input_name": "images",
            "output_names": ["output0"],
            "format": "xyxy + confidence + class_id"
        },
        "preprocessing": {
            "resize": [640, 640],
            "normalize": True,
            "mean": [0, 0, 0],
            "std": [255, 255, 255],
            "bgr_to_rgb": False,
            "note": "YOLO expects RGB [0-1] range, shape [1, 3, 640, 640]"
        },
        "postprocessing": {
            "confidence_threshold": 0.25,
            "iou_threshold": 0.45,
            "max_detections": 100,
            "output_format": "Array of [x1, y1, x2, y2, confidence, class_id]"
        },
        "usage": {
            "pipeline_position": "before_background_removal",
            "purpose": "Auto-crop to largest detected apparel item",
            "fallback": "If no detection, use full image"
        }
    }
    
    config_path = output_dir / "yolo_detection_config.json"
    with open(config_path, "w") as f:
        json.dump(detection_config, f, indent=2)
    print(f"   ✓ Detection config saved to: {config_path}")
    
    print("\n4. Model Specifications:")
    print(f"   Input: 640x640 RGB image")
    print(f"   Output: Bounding boxes [x1, y1, x2, y2, conf, class]")
    print(f"   Format: ONNX opset 14")
    print(f"   Optimized: Simplified for browser inference")
    
    print("\n5. Integration Notes:")
    print("   • Add detection step BEFORE U2-Net background removal")
    print("   • Crop to largest detected bounding box")
    print("   • Fall back to full image if no detections")
    print("   • Expected processing time: 1-2 seconds in browser")
    
    print("\n6. Fine-Tuning Recommendations:")
    print("   For production-quality apparel detection:")
    print("   • Fine-tune on DeepFashion2 dataset (detailed categories)")
    print("   • Include classes: shirt, pants, dress, skirt, coat, etc.")
    print("   • Train for 50-100 epochs on fashion-specific data")
    print("   • Current COCO model is limited to accessories only")
    
    print("\n" + "="*60)
    print("Export Complete!")
    print("="*60)
    print(f"\nGenerated files in '{output_dir}/':")
    print(f"  • yolov8n.onnx (~6MB) - Detection model")
    print(f"  • yolo_apparel_classes.json - Class filter config")
    print(f"  • yolo_detection_config.json - Client-side integration config")
    
    print("\nNext steps:")
    print("1. Copy yolov8n.onnx to raincoat_api/public/models/")
    print("2. Copy JSON configs to raincoat_api/public/models/")
    print("3. Integrate detection in client-side pipeline")
    print("4. Consider fine-tuning on fashion dataset for better accuracy")
    
    return onnx_path, filter_path, config_path


def validate_export(onnx_path):
    """Validate the exported ONNX model"""
    try:
        import onnx
        print("\n" + "="*60)
        print("Model Validation")
        print("="*60)
        
        model = onnx.load(str(onnx_path))
        onnx.checker.check_model(model)
        print("✓ ONNX model is valid")
        
        # Print input/output info
        print("\nModel I/O:")
        for input_tensor in model.graph.input:
            shape = [dim.dim_value for dim in input_tensor.type.tensor_type.shape.dim]
            print(f"  Input: {input_tensor.name}, shape: {shape}")
        
        for output_tensor in model.graph.output:
            shape = [dim.dim_value for dim in output_tensor.type.tensor_type.shape.dim]
            print(f"  Output: {output_tensor.name}, shape: {shape}")
        
        return True
    except ImportError:
        print("\nNote: Install 'onnx' package for model validation")
        print("  pip install onnx")
        return False
    except Exception as e:
        print(f"\n✗ Validation failed: {e}")
        return False


def create_test_inference_script(output_dir):
    """Create a test script for local validation"""
    test_script = '''"""
Test YOLO inference locally before browser deployment
"""
import onnxruntime as ort
import numpy as np
from PIL import Image

def test_yolo_inference(image_path, model_path="models/yolov8n.onnx"):
    """Test YOLO detection on a sample image"""
    
    # Load model
    session = ort.InferenceSession(model_path)
    input_name = session.get_inputs()[0].name
    
    # Load and preprocess image
    img = Image.open(image_path).convert("RGB")
    img_resized = img.resize((640, 640))
    img_array = np.array(img_resized).astype(np.float32) / 255.0
    img_array = np.transpose(img_array, (2, 0, 1))  # HWC to CHW
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    
    # Run inference
    outputs = session.run(None, {input_name: img_array})
    
    print(f"Output shape: {outputs[0].shape}")
    print(f"Detections found: {outputs[0].shape[1]}")
    
    # Parse detections (simplified)
    detections = outputs[0][0]  # Remove batch dimension
    
    # Filter by confidence > 0.25
    confident_detections = detections[detections[:, 4] > 0.25]
    
    print(f"Confident detections (>0.25): {len(confident_detections)}")
    
    for i, det in enumerate(confident_detections[:5]):  # Show top 5
        x1, y1, x2, y2, conf, class_id = det[:6]
        print(f"  Detection {i+1}: class={int(class_id)}, conf={conf:.3f}, bbox=[{x1:.1f}, {y1:.1f}, {x2:.1f}, {y2:.1f}]")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python test_yolo_inference.py <image_path>")
        sys.exit(1)
    
    test_yolo_inference(sys.argv[1])
'''
    
    test_path = output_dir / "test_yolo_inference.py"
    with open(test_path, "w") as f:
        f.write(test_script)
    print(f"\n✓ Test script created: {test_path}")
    print("  Usage: python test_yolo_inference.py <path_to_test_image>")


def main():
    """Main execution"""
    print("Starting YOLO Apparel Model Extraction...\n")
    
    try:
        # Export the model
        onnx_path, filter_path, config_path = export_yolov8_apparel()
        
        # Validate the export
        validate_export(onnx_path)
        
        # Create test script
        create_test_inference_script(Path("models"))
        
        print("\n✓ All tasks completed successfully!")
        
    except Exception as e:
        print(f"\n✗ Error during export: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())