# FashionCLIP Browser Integration Guide

## Model Files
- `fashionclip_image_encoder.onnx` - Image embedding model
- `fashionclip_text_encoder.onnx` - Text embedding model
- Metadata files with preprocessing requirements

## Installation

```bash
npm install onnxruntime-web
```

## Image Embedding Pipeline

### 1. Load Image Encoder
```javascript
import * as ort from 'onnxruntime-web';

const imageSession = await ort.InferenceSession.create(
  './fashionclip_image_encoder.onnx',
  { executionProviders: ['webgpu', 'wasm'] }
);
```

### 2. Preprocess Image
```javascript
function preprocessForFashionCLIP(imageData) {
  // Resize to 224x224
  const resized = resizeImage(imageData, 224, 224);
  
  // Normalize with CLIP stats
  const normalized = normalizeImage(resized, {
    mean: [0.48145466, 0.4578275, 0.40821073],
    std: [0.26862954, 0.26130258, 0.27577711]
  });
  
  return new ort.Tensor('float32', normalized, [1, 3, 224, 224]);
}
```

### 3. Generate Image Embedding
```javascript
async function getImageEmbedding(imageTensor) {
  const feeds = { image: imageTensor };
  const results = await imageSession.run(feeds);
  return results.image_embedding.data; // Float32Array[512]
}
```

## Text Embedding Pipeline (Auto-Tagging)

### 1. Load Text Encoder
```javascript
const textSession = await ort.InferenceSession.create(
  './fashionclip_text_encoder.onnx',
  { executionProviders: ['webgpu', 'wasm'] }
);
```

### 2. Tokenize Text (Simplified)
```javascript
// You'll need a JavaScript CLIP tokenizer
// For now, use pre-computed tokens for common labels
const FASHION_LABELS = {
  "red dress": [/* tokenized array */],
  "blue jeans": [/* tokenized array */],
  "leather jacket": [/* tokenized array */],
  // ... more labels
};
```

### 3. Generate Text Embeddings
```javascript
async function getTextEmbedding(tokens) {
  const tokenTensor = new ort.Tensor('int64', tokens, [1, 77]);
  const feeds = { text_tokens: tokenTensor };
  const results = await textSession.run(feeds);
  return results.text_embedding.data; // Float32Array[512]
}
```

### 4. Auto-Tag by Similarity
```javascript
async function autoTag(imageEmbedding) {
  const similarities = {};
  
  for (const [label, tokens] of Object.entries(FASHION_LABELS)) {
    const textEmbed = await getTextEmbedding(tokens);
    const similarity = cosineSimilarity(imageEmbedding, textEmbed);
    similarities[label] = similarity;
  }
  
  // Return top 3 tags
  return Object.entries(similarities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, score]) => ({ label, score }));
}

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (normA * normB);
}
```

## Complete Pipeline Example

```javascript
async function processClothingImage(imageFile) {
  // 1. Load image
  const imageData = await loadImageData(imageFile);
  
  // 2. Remove background (U2-Net)
  const cleanedImage = await removeBackground(imageData);
  
  // 3. Preprocess for FashionCLIP
  const imageTensor = preprocessForFashionCLIP(cleanedImage);
  
  // 4. Generate embedding
  const embedding = await getImageEmbedding(imageTensor);
  
  // 5. Auto-tag
  const suggestedTags = await autoTag(embedding);
  
  // 6. Return results
  return {
    embedding: Array.from(embedding), // Convert to regular array
    suggestedTags,
    preview: cleanedImage
  };
}
```

## Deployment Checklist

- [ ] Upload ONNX models to CDN
- [ ] Implement image preprocessing utilities
- [ ] Pre-compute text embeddings for common labels
- [ ] Add loading states and error handling
- [ ] Optimize for mobile devices
- [ ] Cache models in browser storage (IndexedDB)

## Performance Notes

**Image Encoder:**
- WebGPU: ~50-150ms per image
- WebAssembly: ~500ms-1s per image

**Text Encoder:**
- Pre-compute embeddings for all labels at app startup
- Cache results to avoid re-computation

**Memory Usage:**
- ~300MB for both models loaded
- ~100MB peak during inference
