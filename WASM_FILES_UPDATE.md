# ONNX Runtime Web 1.16.3 WASM Files Update

## Issue
After updating to onnxruntime-web 1.16.3+, the WASM file names changed from:
- `ort-wasm-simd.wasm` → `ort-wasm-simd-threaded.wasm`
- Added `ort-wasm-simd-threaded.jsep.wasm` for WebGPU support

## Files Updated

### 1. WASM Files Copied ✓
```bash
# Frontend (Next.js)
raincoat_frontend/public/js/onnx/
├── ort-wasm-simd-threaded.wasm (11 MB)
├── ort-wasm-simd-threaded.mjs (24 KB)
├── ort-wasm-simd-threaded.jsep.wasm (20 MB) - For WebGPU
└── ort-wasm-simd-threaded.jsep.mjs (44 KB)

# Backend (Rails API)
raincoat_api/public/js/onnx/
├── ort-wasm-simd-threaded.wasm (11 MB)
├── ort-wasm-simd-threaded.mjs (24 KB)
├── ort-wasm-simd-threaded.jsep.wasm (20 MB)
└── ort-wasm-simd-threaded.jsep.mjs (44 KB)
```

### 2. Next.js Config Updated ✓
**File:** `raincoat_frontend/next.config.ts`

Added:
- ✓ Proper MIME type headers for `.wasm` files (`application/wasm`)
- ✓ CORS headers for SharedArrayBuffer support (required for multi-threading)
- ✓ Explicit rewrites for `/js/onnx/` paths

### 3. ONNX Processor Already Updated ✓
**File:** `raincoat_frontend/lib/onnx-processor.ts`

Already configured:
- ✓ WebGPU execution provider enabled (line 332-335)
- ✓ WASM paths point to `/js/onnx/` (line 288)
- ✓ FP16 model paths updated (line 445, 518)

## What's New in 1.16.3+

### File Changes
- **Old (pre-1.16):** `ort-wasm-simd.wasm` (10 MB)
- **New (1.16.3+):** `ort-wasm-simd-threaded.wasm` (11 MB)
- **New WebGPU:** `ort-wasm-simd-threaded.jsep.wasm` (20 MB)

### Threading Support
ONNX Runtime Web 1.16.3+ requires:
- ✓ SharedArrayBuffer support
- ✓ Cross-Origin-Opener-Policy: `same-origin`
- ✓ Cross-Origin-Embedder-Policy: `require-corp`

These headers are now configured in `next.config.ts`.

### WebGPU Support (JSEP)
The `.jsep.wasm` files enable WebGPU acceleration:
- Automatically loaded when `executionProviders: ['webgpu']` is used
- Provides 1.5-3x speedup on compatible browsers
- Falls back to regular WASM on unsupported browsers

## Testing

### 1. Restart Next.js Dev Server
```bash
cd raincoat_frontend
npm run dev
```

### 2. Check Browser Console
You should see:
```
[ONNX] WASM paths: http://localhost:3001/js/onnx/
[ONNX] WASM configuration: SIMD=true, threads=1
[ONNX] Execution providers: webgpu → wasm (WebGPU detected but not enabled: true)
```

### 3. Verify WASM Loads
Open Network tab and check:
- ✓ `ort-wasm-simd-threaded.wasm` loads successfully (11 MB)
- ✓ MIME type is `application/wasm` (not `application/json`)
- ✓ No 404 errors

### 4. Test Model Loading
Navigate to `/demo` and upload an image. Check for:
- ✓ Background removal works
- ✓ Tag generation works
- ✓ No WASM-related errors in console

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 113+ (WebGPU supported)
- ✅ Edge 113+ (WebGPU supported)
- ✅ Safari 16+ (WASM only, WebGPU in Safari 18+)
- ✅ Firefox 115+ (WASM only)

### WebGPU Requirements
For GPU acceleration (WebGPU):
- Chrome/Edge 121+ for FP16 shader support
- HTTPS or localhost
- SharedArrayBuffer support (requires security headers)

### Fallback Behavior
If WebGPU is unavailable:
- ✓ Automatically falls back to WASM (CPU)
- ✓ Works on all modern browsers
- ✓ Slightly slower but fully functional

## Troubleshooting

### Issue: 404 on WASM files
**Solution:** WASM files were copied to both locations:
```bash
ls raincoat_frontend/public/js/onnx/*.wasm
ls raincoat_api/public/js/onnx/*.wasm
```

### Issue: MIME type error
**Solution:** Next.js headers now set `Content-Type: application/wasm`

### Issue: "SharedArrayBuffer is not defined"
**Solution:** Cross-origin headers added to `next.config.ts`

### Issue: WebGPU not working
**Check:**
1. Browser supports WebGPU (Chrome 113+)
2. Running on HTTPS or localhost
3. Check console for WebGPU detection: `PLATFORM_INFO.supportsWebGPU`

## File Sizes Comparison

### Before (onnxruntime-web 1.14.0)
- Total WASM: ~20 MB
- Total models: ~503 MB (FP32)
- **Total download: ~523 MB**

### After (onnxruntime-web 1.16.3 + FP16 models)
- Total WASM: ~31 MB (includes WebGPU variant)
- Total models: ~153 MB (FP16)
- **Total download: ~184 MB**
- **Savings: 65% smaller!**

## Next Steps

1. ✅ WASM files copied and configured
2. ✅ Next.js headers configured
3. ✅ ONNX processor updated with FP16 paths
4. ⏳ **Copy new FP16 models to production** (see MIGRATION_GUIDE.md)
5. ⏳ **Test in production environment**

## Maintenance

When updating onnxruntime-web in the future:

```bash
# 1. Install new version
npm install onnxruntime-web@latest

# 2. Copy WASM files
cp node_modules/onnxruntime-web/dist/ort-wasm*.{wasm,mjs} public/js/onnx/
cp node_modules/onnxruntime-web/dist/ort-wasm*.{wasm,mjs} ../raincoat_api/public/js/onnx/

# 3. Restart dev server
npm run dev
```

## References

- ONNX Runtime Web Docs: https://onnxruntime.ai/docs/tutorials/web/
- WebGPU Browser Support: https://caniuse.com/webgpu
- SharedArrayBuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
