"""
DEPRECATED, here for reference only.
Export YOLO model and create deployment package for Raincoat
Prepares model files and configuration for browser integration
"""

from pathlib import Path
import json
import shutil

def export_yolo_for_browser():
    """Export YOLO model to browser-ready format"""
    
    print("="*60)
    print("Exporting YOLO for Browser Deployment")
    print("="*60)
    
    # Find trained model
    model_path = Path("runs/raincoat_merged/raincoat_merged/weights/best.pt")
    onnx_path = Path("models/raincoat_merged_yolov8n.onnx")
    
    if not model_path.exists():
        print(f"\n[ERROR] Trained model not found: {model_path}")
        print("        Please complete training first")
        return None
    
    # Load and export if ONNX doesn't exist
    if not onnx_path.exists():
        print("\n1. Converting to ONNX format...")
        from ultralytics import YOLO
        
        model = YOLO(str(model_path))
        onnx_export = model.export(
            format="onnx",
            imgsz=640,
            simplify=True,
            opset=14,
            dynamic=False
        )
        
        onnx_path.parent.mkdir(exist_ok=True)
        shutil.copy2(onnx_export, onnx_path)
        print(f"   [OK] ONNX model: {onnx_path}")
    else:
        print(f"\n1. [OK] ONNX model exists: {onnx_path}")
    
    # Copy to Rails public directory
    rails_public = Path("../raincoat_api/public/models")
    rails_public.mkdir(parents=True, exist_ok=True)
    
    deployed_onnx = rails_public / "yolo_raincoat.onnx"
    shutil.copy2(onnx_path, deployed_onnx)
    print(f"\n2. [OK] Deployed to: {deployed_onnx}")
    
    # Create model configuration
    config = {
        "model_info": {
            "name": "Raincoat YOLO Detector",
            "version": "1.0",
            "architecture": "YOLOv8n",
            "input_shape": [1, 3, 640, 640],
            "input_name": "images",
            "output_names": ["output0"]
        },
        "categories": {
            0: "top",
            1: "bottom",
            2: "outerwear",
            3: "shoes",
            4: "accessories"
        },
        "preprocessing": {
            "resize": [640, 640],
            "normalize": True,
            "letterbox": True,
            "rgb": True,
            "note": "Images must be resized to 640x640 with letterboxing and normalized to [0,1]"
        },
        "postprocessing": {
            "confidence_threshold": 0.25,
            "iou_threshold": 0.45,
            "max_detections": 100,
            "output_format": "[x, y, w, h, ...class_confidences] per detection"
        },
        "usage": {
            "purpose": "Detect clothing category and bounding box before background removal",
            "workflow": [
                "1. User uploads photo",
                "2. YOLO detects category + bbox",
                "3. Auto-crop to bbox (or user selects if multiple)",
                "4. Show detected category to user",
                "5. User confirms or corrects category",
                "6. Proceed with background removal on cropped image"
            ]
        }
    }
    
    config_path = rails_public / "yolo_config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"3. [OK] Configuration: {config_path}")
    
    # Get model size
    size_mb = deployed_onnx.stat().st_size / (1024 * 1024)
    
    print("\n" + "="*60)
    print("DEPLOYMENT READY")
    print("="*60)
    print(f"\nModel: {deployed_onnx}")
    print(f"Size: {size_mb:.1f} MB")
    print(f"Config: {config_path}")
    
    print("\nNext steps:")
    print("  1. Ensure ONNX Runtime Web is available")
    print("  2. Add YOLO detection to upload workflow")
    print("  3. Implement category selection UI")
    
    return deployed_onnx


if __name__ == "__main__":
    export_yolo_for_browser()