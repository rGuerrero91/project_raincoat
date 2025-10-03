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

def create_deployment_readme(output_dir="./notes_and_test data/models"):
    """Create README with deployment instructions."""
    readme_content = """# U2-Net ONNX Model for Browser Deployment

## Model Files
- `u2net.onnx` - Background removal model (~176 MB)
- `u2net_metadata.json` - Model specifications and preprocessing requirements

## Browser Integration

### 1. Install onnxruntime-web
```bash
npm install onnxruntime-web
```

### 2. Load Model in Browser
```javascript
import * as ort from 'onnxruntime-web';

// Load the model
const session = await ort.InferenceSession.create('./u2net.onnx', {
  executionProviders: ['webgpu', 'wasm']  // Try WebGPU first, fallback to WASM
});
```

### 3. Preprocess Image
```javascript
function preprocessImage(imageData) {
  // Resize to 320x320
  const resized = resizeImage(imageData, 320, 320);
  
  // Normalize with ImageNet stats
  const normalized = normalizeImage(resized, {
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225]
  });
  
  // Convert to tensor [1, 3, 320, 320]
  return new ort.Tensor('float32', normalized, [1, 3, 320, 320]);
}
```

### 4. Run Inference
```javascript
async function removeBackground(imageTensor) {
  const feeds = { input: imageTensor };
  const results = await session.run(feeds);
  const mask = results.output;  // [1, 1, 320, 320]
  
  // Apply mask to original image
  return applyMask(originalImage, mask);
}
```

## Deployment Options

### Option A: Serve from Your CDN
Upload `u2net.onnx` to your CDN/static file server:
```
https://cdn.yourapp.com/models/u2net.onnx
```

### Option B: Bundle with App (Not Recommended)
The model is ~176MB, too large for webpack bundling.

### Option C: Progressive Loading
Load model on-demand when user uploads first image:
```javascript
let modelSession = null;

async function ensureModelLoaded() {
  if (!modelSession) {
    modelSession = await ort.InferenceSession.create('./u2net.onnx');
  }
  return modelSession;
}
```

## Performance Considerations

- **WebGPU**: ~100-300ms inference time (GPU accelerated)
- **WebAssembly**: ~1-3s inference time (CPU only)
- **Memory**: ~500MB peak usage during inference
- **First Load**: Model download + initialization ~3-5s

## Privacy Benefits

 Image never leaves the browser
 No server-side processing required
 Works offline after initial model load
"""
    
    readme_path = Path(output_dir) / "README_DEPLOYMENT.md"
    with open(readme_path, 'w') as f:
        f.write(readme_content)
    print(f"\n Created deployment guide: {readme_path}")

if __name__ == "__main__":
    print("=" * 60)
    print("U2-Net ONNX Model Extraction for Browser Deployment")
    print("=" * 60)
    
    success = extract_u2net_model()
    
    if success:
        create_deployment_readme()
        print("\n" + "=" * 60)
        print(" SUCCESS! Model extraction complete.")
        print("\nNext steps:")
        print("1. Review ./models/README_DEPLOYMENT.md")
        print("2. Upload u2net.onnx to your CDN/static server")
        print("3. Implement browser preprocessing pipeline")
        print("=" * 60)
    else:
        print("\n Model extraction failed. Please check the errors above.")