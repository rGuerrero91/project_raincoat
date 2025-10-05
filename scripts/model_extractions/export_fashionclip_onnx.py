#!/usr/bin/env python3
"""
Export FashionCLIP to ONNX format for browser deployment.
Creates separate models for image and text encoding.
Loads directly from HuggingFace without requiring the fashion-clip package.
"""

import torch
import json
from pathlib import Path
from transformers import CLIPModel, CLIPProcessor

def export_fashionclip_models(output_dir="./raincoat_api/public/models"):
    """
    Export FashionCLIP image and text encoders to ONNX.
    
    Args:
        output_dir: Directory to save ONNX models
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print("Loading FashionCLIP model from HuggingFace...")
    model = CLIPModel.from_pretrained("patrickjohncyh/fashion-clip")
    processor = CLIPProcessor.from_pretrained("patrickjohncyh/fashion-clip")
    
    # Export Image Encoder WITH projection layer
    print("\n" + "="*60)
    print("Exporting Image Encoder...")
    print("="*60)
    
    # Create a wrapper that includes the projection layer
    class ImageEncoderWithProjection(torch.nn.Module):
        def __init__(self, clip_model):
            super().__init__()
            self.vision_model = clip_model.vision_model
            self.visual_projection = clip_model.visual_projection
            
        def forward(self, pixel_values):
            vision_outputs = self.vision_model(pixel_values)
            image_embeds = vision_outputs[1]  # pooled output
            image_embeds = self.visual_projection(image_embeds)
            # Normalize
            image_embeds = image_embeds / image_embeds.norm(p=2, dim=-1, keepdim=True)
            return image_embeds
    
    # Create wrapper model
    wrapped_model = ImageEncoderWithProjection(model)
    wrapped_model.eval()
    
    # Create dummy image input (batch_size=1, channels=3, height=224, width=224)
    dummy_image = torch.randn(1, 3, 224, 224)
    
    # Test output dimension
    with torch.no_grad():
        test_output = wrapped_model(dummy_image)
        print(f"Output dimension: {test_output.shape[-1]}")
    
    image_encoder_path = output_path / "fashionclip_image_encoder.onnx"
    
    torch.onnx.export(
        wrapped_model,  # Image encoder WITH projection
        dummy_image,
        image_encoder_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['pixel_values'],
        output_names=['image_embedding'],
        dynamic_axes={
            'pixel_values': {0: 'batch_size'},
            'image_embedding': {0: 'batch_size'}
        }
    )
    
    size_mb = image_encoder_path.stat().st_size / (1024 * 1024)
    print(f"Image encoder exported: {image_encoder_path}")
    print(f"Size: {size_mb:.2f} MB")
    
    # Export Text Encoder
    print("\n" + "="*60)
    print("Exporting Text Encoder...")
    print("="*60)
    
    # Create dummy text input (tokenized)
    dummy_text = torch.randint(0, 49408, (1, 77))  # CLIP uses 49408 vocab, 77 max tokens
    
    text_encoder_path = output_path / "fashionclip_text_encoder.onnx"
    
    torch.onnx.export(
        model.text_model,  # Text encoder component
        dummy_text,
        text_encoder_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input_ids'],
        output_names=['text_embedding'],
        dynamic_axes={
            'input_ids': {0: 'batch_size'},
            'text_embedding': {0: 'batch_size'}
        }
    )
    
    size_mb = text_encoder_path.stat().st_size / (1024 * 1024)
    print(f" Text encoder exported: {text_encoder_path}")
    print(f"   Size: {size_mb:.2f} MB")
    
    # Create metadata files
    create_metadata_files(output_path)
    
    return True

def create_metadata_files(output_path):
    """Create metadata files for both encoders."""
    
    # Image Encoder Metadata
    image_metadata = {
        "model_name": "fashionclip_image_encoder",
        "input_shape": [1, 3, 224, 224],
        "output_shape": [1, 512],  # FashionCLIP embedding dimension
        "preprocessing": {
            "resize": [224, 224],
            "normalize": {
                "mean": [0.48145466, 0.4578275, 0.40821073],
                "std": [0.26862954, 0.26130258, 0.27577711]
            },
            "color_space": "RGB"
        },
        "usage": "Generate image embeddings for clothing items"
    }
    
    with open(output_path / "fashionclip_image_metadata.json", 'w') as f:
        json.dump(image_metadata, f, indent=2)
    
    # Text Encoder Metadata
    text_metadata = {
        "model_name": "fashionclip_text_encoder",
        "input_shape": [1, 77],
        "output_shape": [1, 512],
        "preprocessing": {
            "tokenizer": "CLIP tokenizer",
            "vocab_size": 49408,
            "max_length": 77,
            "padding": "max_length",
            "truncation": True
        },
        "usage": "Generate text embeddings for fashion labels/tags",
        "example_labels": [
            "red dress",
            "blue jeans",
            "leather jacket",
            "running shoes",
            "wool sweater",
            "summer dress",
            "winter coat"
        ]
    }
    
    with open(output_path / "fashionclip_text_metadata.json", 'w') as f:
        json.dump(text_metadata, f, indent=2)
    
    print("\n Created metadata files")

def create_browser_integration_guide(output_dir="./notes_and_test data/models"):
    """Create comprehensive browser integration guide."""
    
    guide_content = """# FashionCLIP Browser Integration Guide

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
"""
    
    guide_path = Path(output_dir) / "FASHIONCLIP_BROWSER_GUIDE.md"
    with open(guide_path, 'w') as f:
        f.write(guide_content)
    print(f" Created browser integration guide: {guide_path}")

if __name__ == "__main__":
    print("=" * 60)
    print("FashionCLIP ONNX Export for Browser Deployment")
    print("=" * 60)
    
    try:
        export_fashionclip_models()
        create_browser_integration_guide()
        
        print("\n" + "=" * 60)
        print(" SUCCESS! FashionCLIP models exported.")
        print("\nGenerated files:")
        print("  - fashionclip_image_encoder.onnx")
        print("  - fashionclip_text_encoder.onnx")
        print("  - Metadata JSON files")
        print("  - Browser integration guide")
        print("\nNext: Upload to CDN and implement browser pipeline")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n Export failed: {e}")
        import traceback
        traceback.print_exc()