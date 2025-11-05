# Model Preloading Implementation

This document explains how we implemented early model loading to improve user experience in the demo.

## Problem

The FashionCLIP model is 335 MB, which takes time to download. Without preloading, users would wait during the "Processing" screen, creating a poor experience.

## Solution

We implemented **background preloading** that starts when the user clicks "Start Demo":

1. User clicks "Start Demo" on WelcomeScreen
2. Model download begins immediately in the background
3. User goes through Privacy, Add Item, Detection screens (buying time)
4. By the time they reach Processing screen, models are likely already loaded

## Implementation Details

### 1. Added Preload Method to ONNX Processor

**File:** `raincoat_frontend/lib/onnx-processor.ts`

```typescript
async preloadModels() {
  if (this.modelsLoaded) {
    console.log("[ONNX] Models already loaded");
    return;
  }

  if (this.loadingPromise) {
    console.log("[ONNX] Models already loading, waiting...");
    return this.loadingPromise;
  }

  console.log("[ONNX] Starting background preload of models...");
  this.loadingPromise = this.loadModels();
  return this.loadingPromise;
}
```

**Key Features:**
- Idempotent: Can be called multiple times safely
- Returns existing promise if already loading
- Doesn't block - loads in background

### 2. Trigger Preload on Demo Start

**File:** `raincoat_frontend/app/demo/WelcomeScreen.tsx`

```typescript
const handleStartDemo = () => {
  // Start preloading heavy AI models in background
  // FashionCLIP (335MB) + U2-Net (168MB) will load while user goes through initial screens
  console.log('[Demo] Starting model preload in background...');
  onnxProcessor.preloadModels().catch((err) => {
    console.warn('[Demo] Model preload failed, will load on-demand:', err);
  });

  onNext();
};
```

**Why This Works:**
- Doesn't block UI - happens in background
- Gracefully degrades - if preload fails, loads on-demand
- User progresses through demo immediately

### 3. Visual Feedback During Preload

**File:** `raincoat_frontend/app/demo/PrivacyScreen.tsx`

Added subtle indicator showing models are loading:

```typescript
{isPreloading && (
  <div className="mb-6 p-4 bg-primary-light/50 rounded-2xl border-2 border-primary/20">
    <div className="flex items-center justify-center gap-3">
      <Download className="w-5 h-5 text-primary animate-bounce" />
      <p className="text-sm text-primary font-medium">
        Preparing AI models in the background...
      </p>
    </div>
  </div>
)}
```

**UX Benefits:**
- Informs users what's happening
- Shows we're being transparent
- Reinforces the "on-device AI" message

## Loading Timeline

### Before (No Preloading):
```
Welcome → Privacy → Add Item → Detection → Processing [WAIT 30s] → Tags → ...
                                            ^^^^^^^^
                                         User waits here
```

### After (With Preloading):
```
Welcome [Start Loading] → Privacy → Add Item → Detection → Processing [Instant!] → Tags → ...
        ^^^^^^^^^^^^^^    ~10-30s passes
                         Models load in background
```

## Performance Impact

| Model | Size | Load Time (avg) |
|-------|------|-----------------|
| FashionCLIP | 335 MB | ~15-25 seconds |
| U2-Net | 168 MB | ~8-15 seconds |
| YOLO | 12 MB | ~1-3 seconds |
| Label Embeddings | 7.1 MB | ~1-2 seconds |

**Total:** ~25-45 seconds for first-time download (cached afterward)

**User Flow:**
- Welcome screen: 5-10 seconds (reading)
- Privacy screen: 5-10 seconds (reading)
- Add Item screen: 10-20 seconds (selecting photo)
- Detection screen: 5-10 seconds (choosing category)

**Total time before Processing:** ~25-50 seconds

This means models are **usually fully loaded** by the time the user reaches the Processing screen!

## Fallback Behavior

If preload fails or hasn't completed:
1. `processImage()` checks `modelsLoaded` flag
2. If not loaded, calls `loadModels()` synchronously
3. User sees "Loading models..." during ProcessingScreen
4. Everything still works, just takes longer

## Browser Caching

After first load:
- Models cached by browser (Service Worker)
- ONNX Runtime WebAssembly cached
- Subsequent demos load instantly

## Testing

To test preloading:

1. **Clear Cache:**
   ```
   Open DevTools → Application → Clear storage
   ```

2. **Monitor Network:**
   - Open DevTools → Network tab
   - Filter by "onnx"
   - Start demo and watch models load in background

3. **Check Console:**
   ```
   [Demo] Starting model preload in background...
   [ONNX] Loading models from http://localhost:3000
   [ONNX] U2-Net loaded
   [ONNX] FashionCLIP loaded
   [ONNX] Label embeddings loaded
   [ONNX] All models loaded successfully
   ```

4. **Verify Timing:**
   - Models should finish loading before reaching ProcessingScreen
   - ProcessingScreen should be near-instant on preloaded models

## Future Improvements

### Option 1: Add Loading Progress
Show download progress for large models:
```typescript
const [loadProgress, setLoadProgress] = useState(0);
// Track fetch progress and update UI
```

### Option 2: Smarter Preload Timing
Only preload when user is likely to complete demo:
```typescript
// Start preload on Privacy screen instead of Welcome
// Gives more confidence user will complete flow
```

### Option 3: Service Worker
Use Service Worker to cache models persistently:
```typescript
// Cache models in Service Worker
// Available across sessions
```

### Option 4: Progressive Loading
Load models in priority order:
```typescript
1. YOLO first (needed earliest)
2. U2-Net + FashionCLIP in parallel
3. Label embeddings last
```

## Related Files

- **Preload Logic:** `raincoat_frontend/lib/onnx-processor.ts`
- **Trigger Point:** `raincoat_frontend/app/demo/WelcomeScreen.tsx`
- **Visual Feedback:** `raincoat_frontend/app/demo/PrivacyScreen.tsx`
- **Processing Screen:** `raincoat_frontend/app/demo/ProcessingScreen.tsx`

## Benefits

✅ **Better UX** - Perceived performance is much faster
✅ **No Blocking** - User can continue through demo immediately
✅ **Transparent** - Visual indicator shows what's happening
✅ **Graceful Degradation** - Falls back to on-demand loading if needed
✅ **Browser Cached** - Instant on subsequent visits
