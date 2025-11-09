Direct answer: iPhones (and Safari specifically) impose **strict memory, threading, and GPU execution limits** that can cause ONNX Runtime Web models—especially large ones like **U²-Net (~167 MB)** or **FashionCLIP (~150 MB)**—to hang or crash in-browser.

Here’s the breakdown by system layer:

---

### 1. **iOS Browser Architecture**

All iOS browsers (Chrome, Firefox, Edge, etc.) use **WebKit under the hood**.
That means:

* You’re really running on **Safari’s JS engine (JavaScriptCore)**.
* **WASM memory caps** and **WebGL/WebGPU context limits** are dictated by Apple, not the browser vendor.

#### Hard limits that affect ONNX models:

| Constraint                        | Safari / iOS limit                        | Impact                                                                                            |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **WASM heap memory**              | ~512 MB (often less on mobile Safari)     | Models + tensors + buffers can exceed this easily during inference.                               |
| **WebGL texture memory**          | ~256 MB typical                           | Background-removal (U²-Net) and CLIP embedding (FashionCLIP) both allocate large tensor textures. |
| **No true multithreading**        | Web Workers limited, no SharedArrayBuffer | ONNX ops that rely on multithreading (like convolution) can bottleneck or hang.                   |
| **Aggressive memory reclamation** | iOS kills tab if memory exceeds threshold | Appears to users as a “crash” or reload during model load or inference.                           |
| **WASM SIMD & threads**           | Limited support depending on iOS version  | Some ONNX builds assume SIMD support and fail silently if unavailable.                            |

---

### 2. **ONNX Runtime Web Behavior on iOS**

When you run:

```js
const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm', 'webgpu'] });
```

Safari frequently falls back to:

* **`wasm` only**, because **WebGPU is still behind a flag** (as of iOS 17.5).
* **No SIMD**, slower ops, higher memory.
* **No persistent caching**, so each reload reinitializes the model.

That combination can cause:

* High first-load latency (tens of seconds for large ONNX files)
* Out-of-memory during `run()` for segmentation networks like U²-Net
* Device auto-reloading the page

---

### 3. **Likely Culprits for Each Crash Phase**

| Stage                                  | Root cause                                       | Typical symptom                         |
| -------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| **Model load**                         | Out-of-memory (U²-Net too large for Safari heap) | Page reloads or freezes mid-load        |
| **Background removal**                 | Float32 tensor buffers > 200 MB                  | Safari tab killed or WebGL context lost |
| **Embedding generation (FashionCLIP)** | WebGL → CPU fallback too slow                    | Safari “hung” message                   |
| **Multiple inferences in one session** | Garbage collection lag                           | Gradual slowdown → reload               |

---

### 4. **Fixes / Mitigations**

**Short term**

* Quantize and resize models:
  Convert U²-Net and FashionCLIP to **FP16 or INT8** with ONNX quantization tools. This can shrink memory use by 50–75%.
* Use **smaller input sizes** (e.g. 224×224 instead of 320×320).
* Preload models lazily only when needed.
* Force the **`wasm` backend** and **disable WebGL** on Safari:

  ```js
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const options = isIOS ? { executionProviders: ['wasm'] } : { executionProviders: ['webgpu', 'wasm'] };
  ```
* Chunk background-removal operations or use downscaled masks, then upscale the result.

**Medium term**

* Offer **remote inference fallback** for constrained devices (optional user consent).
* Bundle **“lite” model variants** specifically for mobile Safari.

**Long term**

* Migrate to **WebNN API** (when available) or a dedicated **WebAssembly SIMD build** tuned for iOS.
* Use **service workers** + **IndexedDB caching** to reduce repeated initialization.

---

### 5. **Implemented Solutions (As of January 2025)**

The Raincoat frontend now includes comprehensive iOS/Safari compatibility fixes:

#### ✅ **iOS Detection & Platform-Aware Configuration**
- Automatic detection of iOS/Safari/mobile browsers
- WASM SIMD capability testing (falls back gracefully on iOS < 14.5)
- **WebGPU support detection** - Detection implemented, activation pending further testing
- Execution provider: `["wasm"]` (universal compatibility, WebGPU to be enabled in future update)
- Platform-specific configuration:
  - iOS: 256×256 U2-Net input (vs 320×320 desktop)
  - Mobile: "low" quality mode, Desktop: "medium" quality mode
  - Mobile: 320px max image size, Desktop: 400px max

#### ✅ **Lazy Loading Strategy**
- **Models load individually on-demand** (not all at once)
- Individual loading methods: `loadU2Net()`, `loadFashionClip()`, `loadLabelEmbeddings()`
- Prevents exceeding ~512MB WASM heap by avoiding simultaneous 503MB model load
- Progress indicators show: "Loading background removal model...", "Loading image analysis model...", etc.
- Desktop users benefit from faster initial load, mobile users avoid OOM crashes

#### ✅ **Storage Quota Checks & Enhanced Cache Management**
- Before caching models in IndexedDB, checks available storage quota
- User-friendly error messages if insufficient space (requires ~550MB)
- Prevents silent failures when IndexedDB quota is exhausted
- **Graceful fallback mode**: If quota exceeded, models still work but won't be cached
- Enhanced cache statistics showing storage quota usage
- Quota exceeded errors provide actionable steps to free up space

#### ✅ **Memory Management Optimizations**
1. **Blob URLs instead of Data URLs**
   - All `canvas.toDataURL()` replaced with `canvas.toBlob()` + `URL.createObjectURL()`
   - Reduces memory pressure by 2-3x (blob URLs reference memory, data URLs duplicate it as base64)
   - Automatic cleanup with `URL.revokeObjectURL()` after use

2. **Explicit Canvas Cleanup**
   - After operations, canvas dimensions reset: `canvas.width = 0; canvas.height = 0`
   - Helps iOS Safari release canvas contexts and avoid context limit
   - All 5+ canvas creation points now have explicit cleanup

3. **Object URL Cleanup**
   - All `URL.createObjectURL()` calls paired with `URL.revokeObjectURL()`
   - Prevents memory leaks from accumulating blob references

#### ✅ **RequestAnimationFrame Yielding**
- Pixel-by-pixel operations in `applyMask()` now process in chunks (50 rows at a time)
- Yields to browser via `requestAnimationFrame()` between chunks (iOS/mobile only)
- Prevents iOS "unresponsive script" warnings and tab suspension
- Desktop bypasses yielding for maximum performance

#### ✅ **User-Friendly Error Messages**
- Out-of-memory errors: "Unable to load model due to memory constraints. Try closing other browser tabs and reload."
- Storage quota errors: Shows available vs required space
- Generic failures: Context-specific messages (background removal, image analysis, label data)
- All errors catch common iOS issues (memory, allocation, storage, quota)

#### ✅ **No Preloading on Mobile**
- `preloadModels()` deprecated for low-memory devices
- WelcomeScreen no longer triggers preload (was loading 503MB on demo start)
- Models load exactly when needed during `processImage()` workflow

#### ✅ **Timeout Safeguards (NEW - January 2025)**
- All model loading and inference operations wrapped with platform-aware timeouts
- Mobile devices: 90s model load / 45s inference
- Desktop devices: 60s model load / 30s inference
- Prevents indefinite hangs that can cause iOS Safari tab suspension
- Clear timeout error messages with actionable troubleshooting steps
- Implemented via `withTimeout()` wrapper using Promise.race pattern

#### ✅ **Memory Pressure Detection (NEW - January 2025)**
- Real-time memory monitoring using Performance Memory API (Chrome/Edge)
- Platform-based heuristics for Safari/Firefox (no Memory API)
- Memory pressure levels: low, medium, high, critical
- Warnings logged before loading large models (U2-Net 168MB, FashionCLIP 335MB)
- Post-operation memory checks after intensive tasks
- User recommendations based on memory status:
  - Critical: "Close other browser tabs immediately"
  - High: "Consider closing tabs, reduce image sizes"
  - Medium: "Using conservative settings"
  - Low: "All optimizations available"

#### ✅ **User Consent Prompt (NEW - January 2025)**
- Mobile users see consent modal before demo starts
- Explains storage requirements (~500MB), WiFi recommendation, data usage
- Consent stored in sessionStorage (no repeat prompts in same session)
- Users can decline to avoid data charges
- Privacy-first messaging emphasizing on-device processing

#### **Implementation Files**
- [onnx-processor.ts](../../../raincoat_frontend/lib/onnx-processor.ts) - Core ONNX processing with all iOS fixes, timeout safeguards, memory pressure detection, WebGPU detection
- [yolo-detector.ts](../../../raincoat_frontend/lib/yolo-detector.ts) - YOLOv8 detection with memory-optimized Blob URLs
- [WelcomeScreen.tsx](../../../raincoat_frontend/app/demo/WelcomeScreen.tsx) - User consent prompt for mobile, no preload trigger
- [model_cache.js](../../../raincoat_frontend/public/js/model_cache.js) - Enhanced quota management with graceful fallback
- [ProcessingScreen.tsx](../../../raincoat_frontend/app/demo/ProcessingScreen.tsx) - Uses lazy loading (unchanged)

---

### 6. **Testing Approach**

* Use Safari's "Web Inspector" → "Timelines" → "Memory" to watch heap growth.
* Simulate constrained devices with `--js-flags="--max-old-space-size=256"` in a desktop environment to catch OOM early.
* Benchmark memory and latency for both backends (`wasm` vs `webgpu`) on each device class (A14, A15, A16 chips differ in limits).
* **iOS Testing Checklist:**
  - [ ] User consent modal appears on mobile devices
  - [ ] Consent can be accepted or declined
  - [ ] Console shows platform detection info (iOS, WASM SIMD, WebGPU support)
  - [ ] Console shows execution providers selected (webgpu/wasm/cpu)
  - [ ] Model load completes without page reload (check console for "loaded successfully" logs)
  - [ ] Timeout safeguards prevent indefinite hangs (max 90s mobile, 60s desktop)
  - [ ] Memory pressure warnings appear in console before large model loads
  - [ ] Background removal processes without crash (watch memory timeline)
  - [ ] Embedding generation completes (check for valid embedding magnitude)
  - [ ] Multiple image processing sessions work without slowdown
  - [ ] Blob URLs cleaned up (check `chrome://blob-internals` or memory timeline)
  - [ ] Storage quota respected (check IndexedDB size in DevTools)
  - [ ] Quota exceeded errors show user-friendly messages
  - [ ] Demo works even if caching fails due to quota limits (graceful fallback)

---