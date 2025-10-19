
# ModaNet YOLOv8n Integration Guide

## Client-Side Integration

### 1. Load the ONNX Model

```javascript
// Load ONNX Runtime
import * as ort from 'onnxruntime-web';

// Configure WASM paths
ort.env.wasm.wasmPaths = '/js/onnx/';

// Load model
const session = await ort.InferenceSession.create('/models/modanet_yolov8n.onnx');
```

### 2. Preprocess Image

```javascript
function preprocessImage(imageElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Resize to 640x640 with letter boxing
  canvas.width = 640;
  canvas.height = 640;
  
  // Calculate scaling to maintain aspect ratio
  const scale = Math.min(640 / imageElement.width, 640 / imageElement.height);
  const scaledWidth = imageElement.width * scale;
  const scaledHeight = imageElement.height * scale;
  
  // Center the image
  const x = (640 - scaledWidth) / 2;
  const y = (640 - scaledHeight) / 2;
  
  // Fill with gray (letterbox)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 640, 640);
  
  // Draw scaled image
  ctx.drawImage(imageElement, x, y, scaledWidth, scaledHeight);
  
  // Get image data and convert to tensor
  const imageData = ctx.getImageData(0, 0, 640, 640);
  const pixels = imageData.data;
  
  // Convert to [1, 3, 640, 640] float32 tensor, normalized to [0, 1]
  const tensor = new Float32Array(1 * 3 * 640 * 640);
  
  for (let i = 0; i < 640 * 640; i++) {
    tensor[i] = pixels[i * 4] / 255.0;                    // R
    tensor[640 * 640 + i] = pixels[i * 4 + 1] / 255.0;    // G
    tensor[640 * 640 * 2 + i] = pixels[i * 4 + 2] / 255.0; // B
  }
  
  return new ort.Tensor('float32', tensor, [1, 3, 640, 640]);
}
```

### 3. Run Inference

```javascript
async function detectClothing(imageElement) {
  const inputTensor = preprocessImage(imageElement);
  
  const feeds = { images: inputTensor };
  const results = await session.run(feeds);
  
  const output = results.output0.data;
  
  return output;
}
```

### 4. Post-process Detections

```javascript
function postprocessDetections(output, confidenceThreshold = 0.25, iouThreshold = 0.45) {
  // YOLOv8 output format: [batch, 9, 8400]
  // 9 = 4 (bbox) + 5 (Raincoat classes)
  
  const detections = [];
  
  // Parse detections
  for (let i = 0; i < 8400; i++) {
    const classScores = [];
    for (let c = 0; c < 5; c++) {  // Only our 5 classes
      classScores.push(output[4 + c + i * 84]);
    }
    
    const maxScore = Math.max(...classScores);
    const classId = classScores.indexOf(maxScore);
    
    if (maxScore > confidenceThreshold) {
      const x1 = output[i * 84];
      const y1 = output[i * 84 + 1];
      const x2 = output[i * 84 + 2];
      const y2 = output[i * 84 + 3];
      
      detections.push({
        bbox: [x1, y1, x2, y2],
        confidence: maxScore,
        classId: classId,
        className: RAINCOAT_CLASSES[classId]
      });
    }
  }
  
  // Apply NMS (Non-Maximum Suppression)
  return applyNMS(detections, iouThreshold);
}
```

### 5. Crop to Detected Clothing

```javascript
function cropToLargestDetection(imageElement, detections) {
  if (detections.length === 0) {
    return imageElement; // No detection, use full image
  }
  
  // Find largest detection by area
  const largest = detections.reduce((max, det) => {
    const area = (det.bbox[2] - det.bbox[0]) * (det.bbox[3] - det.bbox[1]);
    const maxArea = (max.bbox[2] - max.bbox[0]) * (max.bbox[3] - max.bbox[1]);
    return area > maxArea ? det : max;
  });
  
  // Crop image to detection bbox
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const [x1, y1, x2, y2] = largest.bbox;
  const width = x2 - x1;
  const height = y2 - y1;
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.drawImage(imageElement, x1, y1, width, height, 0, 0, width, height);
  
  return canvas;
}
```

## Pipeline Integration

```javascript
async function processClothingPhoto(imageFile) {
  // 1. Load image
  const img = await loadImage(imageFile);
  
  // 2. Detect clothing
  const detections = await detectClothing(img);
  
  // 3. Crop to largest detection
  const croppedImage = cropToLargestDetection(img, detections);
  
  // 4. Continue with existing pipeline
  const processedImage = await removeBackground(croppedImage);  // U2-Net
  const embedding = await generateEmbedding(processedImage);     // FashionCLIP
  const tags = await autoTag(embedding);                         // Label matching
  
  // 5. Present to user for validation
  return { croppedImage, processedImage, embedding, tags, detections };
}
```

## Model Performance

- **Inference Time**: 1-2 seconds in browser (CPU)
- **Model Size**: ~6MB
- **Accuracy**: mAP50 ~0.75 on ModaNet validation
- **Classes**: 5 user selected clothing categories
- **Input**: 640x640 RGB
- **Output**: Bounding boxes + class predictions

## Next Steps

1. Copy `raincoat_yolov8n.onnx` to `raincoat_api/public/models/`
2. Copy JSON configs to `raincoat_api/public/models/`
3. Implement client-side detection in upload workflow
4. Test with various clothing photos
5. Adjust confidence threshold based on results
