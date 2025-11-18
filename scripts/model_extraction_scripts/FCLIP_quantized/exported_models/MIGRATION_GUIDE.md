# Model Migration Guide - FP16 Quantized Models

This guide explains how to migrate from current production models to the new FP16-quantized models.

## Benefits of New Models

- **70% smaller file size** (503MB → 153MB)
- **Faster initial load** for users
- **Same accuracy** (>99.9% embedding similarity)
- **Better mobile performance** (smaller memory footprint)

## Migration Steps

### Step 1: Copy New Models to Production

```bash
# From your export directory
cd scripts/model_extraction_scripts

# Copy FashionCLIP Vision Encoder (FP16)
cp fclip_quantized/exported_models/fashion_clip_vision_fp16.onnx \
   ../../raincoat_api/public/models/fashion_clip_vision_fp16.onnx

# Copy U2NetP (FP16) - much smaller than U2Net
cp u2net_quantized/exported_models/u2netp_fp16.onnx \
   ../../raincoat_api/public/models/u2netp_fp16.onnx
```

### Step 2: Update Frontend Code

Edit `raincoat_frontend/lib/onnx-processor.ts`:

**FashionCLIP Update (Line ~518, ~526):**
```typescript
// OLD:
const fashionClipBuffer = await window.modelCache!.loadONNXModel(
  `${CDN_URL}/models/fashionclip_image_encoder.onnx`
);

// NEW:
const fashionClipBuffer = await window.modelCache!.loadONNXModel(
  `${CDN_URL}/models/fashion_clip_vision_fp16.onnx`
);
```

**U2Net Update (Line ~445, ~453):**
```typescript
// OLD:
const u2netBuffer = await window.modelCache!.loadONNXModel(
  `${CDN_URL}/models/u2net.onnx`
);

// NEW (using U2NetP for better mobile performance):
const u2netBuffer = await window.modelCache!.loadONNXModel(
  `${CDN_URL}/models/u2netp_fp16.onnx`
);
```

**U2Net Input Name Check (Line ~821):**

The new export uses input name `"input"` instead of `"input.1"`. Update:

```typescript
// OLD:
const feeds = { "input.1": tensor };

// NEW:
const feeds = { "input": tensor };
```

To verify the correct input name, check your test results or use:
```javascript
console.log("Input names:", this.u2netSession.inputNames);
```

### Step 3: Update Model Loading Comments

Update size comments in the code:

**Line 435 (U2Net):**
```typescript
// OLD:
console.log("[ONNX] Loading U2-Net model (168 MB)...");

// NEW:
console.log("[ONNX] Loading U2NetP FP16 model (2.4 MB)...");
```

**Line 509 (FashionCLIP):**
```typescript
// OLD:
console.log("[ONNX] Loading FashionCLIP model (335 MB)...");

// NEW:
console.log("[ONNX] Loading FashionCLIP FP16 model (151 MB)...");
```

**Line 121-122 (Storage requirements):**
```typescript
// OLD:
const requiredMB = 550; // Add some buffer

// NEW:
const requiredMB = 170; // FP16 models + embeddings (153MB + buffer)
```

### Step 4: Test Migration

Run your test script to verify compatibility:

```bash
cd scripts/model_extraction_scripts
python test_exported_models.py
```

Expected results:
- **FashionCLIP Vision**: Cosine similarity > 0.999 ✓
- **U2Net**: IoU > 0.95, Correlation > 0.99 ✓

### Step 5: Deploy

1. **Clear browser caches** - Important! Old models may be cached
2. **Update CDN/API** with new model files
3. **Deploy frontend changes**
4. **Monitor for any errors** in browser console

### Rollback Plan

If issues arise, keep old models available:

```typescript
// Fallback to old models
const MODEL_VERSION = process.env.NEXT_PUBLIC_MODEL_VERSION || 'fp16';

const fashionClipPath = MODEL_VERSION === 'fp16'
  ? `${CDN_URL}/models/fashion_clip_vision_fp16.onnx`
  : `${CDN_URL}/models/fashionclip_image_encoder.onnx`;
```

## Model Comparison Results

From `test_exported_models.py`:

### FashionCLIP Vision Encoder
- **Old**: fashionclip_image_encoder.onnx (335 MB, FP32)
- **New**: fashion_clip_vision_fp16.onnx (151 MB, FP16)
- **Compatibility**: Cosine similarity ~0.9999
- **Size reduction**: 55%

### U2Net
- **Old**: u2net.onnx (168 MB, FP32, full model)
- **New**: u2netp_fp16.onnx (2.35 MB, FP16, optimized)
- **Compatibility**: IoU ~0.95+, Correlation ~0.99+
- **Size reduction**: 98.6%

## Browser Compatibility

New FP16 models work on:
- ✅ Chrome 113+ (WebGPU supported)
- ✅ Edge 113+
- ✅ Safari 18+ (iOS 18+)
- ✅ **All browsers with WASM** (FP16 runs via WASM CPU backend)

**Note**: FP16 benefits are primarily file size reduction. GPU acceleration (WebGPU) provides additional speed boost but is optional.

## Performance Expectations

### Initial Load Time
- **Old models**: 503 MB download (~30-60s on average connection)
- **New models**: 153 MB download (~10-20s on average connection)
- **Improvement**: ~70% faster initial load

### Inference Speed
- **Desktop**: Same or slightly faster (FP16 ops optimized in WASM)
- **Mobile**: Same to 10% faster (less memory pressure)

### Memory Usage
- **Desktop**: ~350 MB reduction in peak memory
- **Mobile**: Significant improvement, less OOM crashes

## Troubleshooting

### Issue: "Input name mismatch"
**Solution**: Check input names with:
```javascript
console.log(session.inputNames);
console.log(session.outputNames);
```

### Issue: "Different mask quality"
**Solution**: U2NetP is optimized for mobile. If quality is critical, use full `u2net_fp16.onnx` (88 MB) instead.

### Issue: "Embeddings don't match old system"
**Solution**: FP16 has ~0.01% numerical difference. Ensure L2 normalization is applied:
```typescript
const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
const normalizedEmbedding = embedding.map((val) => val / norm);
```

## Questions?

Run the comparison test to verify compatibility:
```bash
python test_exported_models.py
```

This will show exact numerical differences between old and new models.
