# U2-Net ONNX Model for Browser Deployment

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
