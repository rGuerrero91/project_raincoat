#!/usr/bin/env python3
"""
Extract U2-Net ONNX model from rembg for browser deployment.
This script locates the ONNX model that rembg uses internally and prepares it for web use.
"""

import os
import shutil
from pathlib import Path
from rembg import new_session

def extract_u2net_model(output_dir="./raincoat_api/public/models"):
    """
    Extract U2-Net ONNX model from rembg cache.
    
    Args:
        output_dir: Directory to copy the model to
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Initialize rembg session - this downloads/locates the model
    print("Initializing rembg session (this will download model if needed)...")
    session = new_session(model_name="u2net")
    
    # Find model location
    home = Path.home()
    u2net_cache = home / ".u2net"
    
    print(f"\nSearching for models in: {u2net_cache}")
    
    if not u2net_cache.exists():
        print(" U2-Net cache directory not found!")
        return False
    
    # List all ONNX models
    onnx_files = list(u2net_cache.glob("*.onnx"))
    
    if not onnx_files:
        print(" No ONNX models found in cache!")
        return False
    
    print(f"\n Found {len(onnx_files)} ONNX model(s):")
    
    for model_file in onnx_files:
        # Get file size
        size_mb = model_file.stat().st_size / (1024 * 1024)
        print(f"\n   {model_file.name}")
        print(f"     Size: {size_mb:.2f} MB")
        
        # Copy to output directory
        dest = output_path / model_file.name
        shutil.copy2(model_file, dest)
        print(f"      Copied to: {dest}")
        
        # Create metadata file
        metadata = {
            "model_name": model_file.stem,
            "input_shape": [1, 3, 320, 320],  # U2-Net standard input
            "output_shape": [1, 1, 320, 320],  # Mask output
            "size_mb": round(size_mb, 2),
            "preprocessing": {
                "resize": [320, 320],
                "normalize": {
                    "mean": [0.485, 0.456, 0.406],
                    "std": [0.229, 0.224, 0.225]
                }
            },
            "usage": "Background removal / segmentation"
        }
        
        import json
        metadata_file = output_path / f"{model_file.stem}_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"      Metadata: {metadata_file}")
    
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("U2-Net ONNX Model Extraction for Browser Deployment")
    print("=" * 60)
    
    success = extract_u2net_model()
    
    if success:
        print("\n" + "=" * 60)
        print(" SUCCESS! Model extraction complete.")
    else:
        print("\n Model extraction failed. Please check the errors above.")