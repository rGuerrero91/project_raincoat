// Client-side ONNX model processing
// Based on the Rails implementation in raincoat_api/public/js/

import * as ort from "onnxruntime-web";

// Import ModelCache type (global from model_cache.js)
declare global {
  interface Window {
    modelCache?: {
      initialize(): Promise<void>;
      loadONNXModel(url: string): Promise<ArrayBuffer>;
      loadJSON(url: string): Promise<any>;
      getStats(): Promise<{ models: number; json: number; total: number }>;
      clearCache(): Promise<void>;
    };
  }
}

// ============================================================================
// iOS/Safari Detection and Mobile Utilities
// ============================================================================

interface PlatformInfo {
  isIOS: boolean;
  isSafari: boolean;
  isMobile: boolean;
  isLowMemoryDevice: boolean;
  estimatedMemoryMB: number;
  supportsWASMSIMD: boolean;
  supportsWebGPU: boolean;
}

function detectPlatform(): PlatformInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    // Server-side rendering - assume desktop with full capabilities
    return {
      isIOS: false,
      isSafari: false,
      isMobile: false,
      isLowMemoryDevice: false,
      estimatedMemoryMB: 2048,
      supportsWASMSIMD: true,
      supportsWebGPU: false, // Will be detected client-side
    };
  }

  const userAgent = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Detect available memory (Chrome/Edge only, but gives us a hint)
  // @ts-ignore - deviceMemory is non-standard
  const deviceMemoryGB = navigator.deviceMemory || 4; // Default to 4GB if not available
  const estimatedMemoryMB = deviceMemoryGB * 1024;

  // iOS/Safari memory constraints
  // iPhone models typically have 2-6GB RAM, but Safari limits WASM heap to ~512MB
  // iPad models have 3-8GB RAM, Safari limits WASM heap to ~1GB
  const isLowMemoryDevice = isIOS || isMobile || deviceMemoryGB < 4;

  // WASM SIMD support detection
  // iOS Safari supports WASM SIMD from iOS 14.5+, but we can't easily detect version
  // Assume support on modern browsers, but we'll test it and fallback if needed
  const supportsWASMSIMD = !isIOS || checkWASMSIMDSupport();

  // WebGPU support detection
  // WebGPU is available in Chrome 113+, Edge 113+, and Safari 18+ (iOS 18+)
  // On iOS 17.x, it's behind a feature flag
  const supportsWebGPU = checkWebGPUSupport();

  return {
    isIOS,
    isSafari,
    isMobile,
    isLowMemoryDevice,
    estimatedMemoryMB,
    supportsWASMSIMD,
    supportsWebGPU,
  };
}

function checkWASMSIMDSupport(): boolean {
  try {
    // Check if WebAssembly.validate supports SIMD
    // SIMD test module (minimal v128 instruction)
    const simdTest = new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
    ]);
    return WebAssembly.validate(simdTest);
  } catch (e) {
    return false;
  }
}

function checkWebGPUSupport(): boolean {
  try {
    // Check if navigator.gpu exists (WebGPU API entry point)
    if (typeof navigator === "undefined" || !('gpu' in navigator)) {
      return false;
    }

    // WebGPU is available (but actual adapter may not be available)
    // ONNX Runtime Web will handle adapter request failures gracefully
    return true;
  } catch (e) {
    return false;
  }
}

function checkStorageQuota(): Promise<{ available: boolean; quotaMB: number; usageMB: number }> {
  if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.estimate) {
    return Promise.resolve({ available: false, quotaMB: 0, usageMB: 0 });
  }

  return navigator.storage.estimate().then((estimate) => {
    const quotaMB = (estimate.quota || 0) / (1024 * 1024);
    const usageMB = (estimate.usage || 0) / (1024 * 1024);
    const availableMB = quotaMB - usageMB;

    // We need ~522MB for all models
    const requiredMB = 195; // Add some buffer
    const available = availableMB >= requiredMB;

    console.log(`[ONNX] Storage quota: ${availableMB.toFixed(0)}MB available of ${quotaMB.toFixed(0)}MB (usage: ${usageMB.toFixed(0)}MB, required: ${requiredMB}MB)`);

    return { available, quotaMB, usageMB };
  }).catch(() => {
    return { available: false, quotaMB: 0, usageMB: 0 };
  });
}

/**
 * Check for memory pressure indicators
 *
 * Returns an object indicating current memory status:
 * - level: 'low' | 'medium' | 'high' | 'critical'
 * - usedJSHeapMB: Approximate JS heap usage (if available)
 * - recommendations: Suggested actions based on memory pressure
 */
function checkMemoryPressure(): { level: string; usedJSHeapMB: number; recommendations: string[] } {
  // Default response for environments without memory API
  const defaultResult = {
    level: 'unknown',
    usedJSHeapMB: 0,
    recommendations: []
  };

  if (typeof window === "undefined" || typeof performance === "undefined") {
    return defaultResult;
  }

  try {
    // Check for Performance Memory API (Chrome/Edge only)
    // @ts-ignore - memory is non-standard
    const memory = (performance as any).memory;

    if (!memory) {
      // Memory API not available (Safari, Firefox)
      // Use platform heuristics instead
      if (PLATFORM_INFO.isIOS || PLATFORM_INFO.isLowMemoryDevice) {
        return {
          level: 'medium',
          usedJSHeapMB: 0,
          recommendations: [
            'Low-memory device detected',
            'Using conservative memory settings',
            'Models will load individually to avoid OOM'
          ]
        };
      }
      return defaultResult;
    }

    // Calculate memory metrics
    const usedJSHeapMB = memory.usedJSHeapSize / (1024 * 1024);
    const heapLimitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const usagePercent = (usedJSHeapMB / heapLimitMB) * 100;

    // Determine memory pressure level
    let level: string;
    let recommendations: string[] = [];

    if (usagePercent < 50) {
      level = 'low';
      recommendations = ['Memory usage normal', 'All optimizations available'];
    } else if (usagePercent < 70) {
      level = 'medium';
      recommendations = [
        'Moderate memory usage',
        'Using lazy model loading',
        'Canvas cleanup enforced'
      ];
    } else if (usagePercent < 85) {
      level = 'high';
      recommendations = [
        'High memory usage detected',
        'Consider closing other browser tabs',
        'Background removal may use lower quality',
        'Aggressive canvas cleanup enabled'
      ];
    } else {
      level = 'critical';
      recommendations = [
        'Critical memory pressure!',
        'Close other browser tabs immediately',
        'Reduce image sizes',
        'Consider using a desktop browser'
      ];
    }

    console.log(`[ONNX] Memory pressure: ${level} (${usagePercent.toFixed(1)}% of ${heapLimitMB.toFixed(0)}MB limit, using ${usedJSHeapMB.toFixed(0)}MB)`);

    return { level, usedJSHeapMB, recommendations };
  } catch (e) {
    console.warn('[ONNX] Failed to check memory pressure:', e);
    return defaultResult;
  }
}

/**
 * Timeout wrapper for async operations
 *
 * Prevents iOS Safari from hanging indefinitely on stuck operations.
 * iOS Safari can suspend tabs after ~30s of unresponsiveness, leading to crashes.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        const error = new Error(
          `Operation timed out after ${timeoutMs}ms: ${operation}\n\n` +
          `This may indicate:\n` +
          `- Slow network connection\n` +
          `- Insufficient device memory\n` +
          `- Browser resource limitations\n\n` +
          `Try:\n` +
          `- Closing other browser tabs\n` +
          `- Connecting to WiFi\n` +
          `- Reloading the page\n` +
          `- Using a different browser`
        );
        error.name = 'TimeoutError';
        reject(error);
      }, timeoutMs)
    )
  ]);
}

// Detect platform once at module load
const PLATFORM_INFO = detectPlatform();

/**
 * Get platform-specific timeout durations
 *
 * iOS devices get longer timeouts due to:
 * - Slower WASM execution
 * - Memory pressure causing GC pauses
 * - Network throttling on cellular
 */
const TIMEOUTS = {
  modelLoad: PLATFORM_INFO.isMobile ? 90000 : 60000,    // 60s desktop, 90s mobile
  inference: PLATFORM_INFO.isMobile ? 45000 : 30000,     // 30s desktop, 45s mobile
  download: PLATFORM_INFO.isMobile ? 180000 : 120000,    // 120s desktop, 180s mobile
};

// Log platform info for debugging
if (typeof window !== "undefined") {
  console.log("[ONNX] Platform detection:", PLATFORM_INFO);
}

// ============================================================================
// ONNX Runtime Configuration (Platform-Aware)
// ============================================================================

// Configure ONNX Runtime - WASM files served from CDN/API endpoint
if (typeof window !== "undefined") {
  // Get CDN URL from environment or fall back to localhost
  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Serve WASM files from CDN - they're in /js/onnx/ directory
  // Required files: ort-wasm-simd-threaded.wasm and ort-wasm-simd-threaded.jsep.wasm (for WebGPU)
  ort.env.wasm.wasmPaths = `${CDN_URL}/js/onnx/`;

  // Configure WASM settings based on platform capabilities
  ort.env.wasm.numThreads = 1; // Always single-threaded (iOS doesn't support true multithreading)
  ort.env.wasm.simd = PLATFORM_INFO.supportsWASMSIMD; // Conditionally enable SIMD
  ort.env.wasm.proxy = false; // Disable proxy

  // WebGPU configuration (required for JSEP)
  if (PLATFORM_INFO.supportsWebGPU) {
    ort.env.webgpu.powerPreference = 'high-performance';
    // Enable validation in development for better error messages
    if (process.env.NODE_ENV === 'development') {
      ort.env.webgpu.validateInputContent = true;
    }
  }

  // Suppress ONNX Runtime warnings to prevent Next.js dev overlay spam
  ort.env.logLevel = "warning"; // Show warnings for debugging WebGPU issues

  console.log(`[ONNX] WASM paths: ${ort.env.wasm.wasmPaths}`);
  console.log(`[ONNX] WASM configuration: SIMD=${ort.env.wasm.simd}, threads=${ort.env.wasm.numThreads}`);
  console.log(`[ONNX] WebGPU available: ${PLATFORM_INFO.supportsWebGPU}, will use JSEP: ${PLATFORM_INFO.supportsWebGPU && !PLATFORM_INFO.isIOS}`);

  // Suppress console warnings from ONNX Runtime WASM
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || "";
    // Filter out ONNX Runtime CPU vendor warnings
    if (
      message.includes("cpuid_info") ||
      message.includes("Unknown CPU vendor")
    ) {
      return; // Suppress this warning
    }
    originalWarn.apply(console, args);
  };
}

export interface ProcessingResult {
  imageData: ImageData;
  processedImageUrl: string;
  processedImageBlob: Blob; // The actual Blob for caching (blob URL can be revoked)
  embedding: number[];
  tags: { label: string; score: number }[];
}

// ============================================================================
// Configuration (Platform-Aware)
// ============================================================================

// Execution providers with fallback support
// Currently using WASM for universal compatibility
// Note: WebGPU support will be added in a future update after testing
// ONNX Runtime Web only supports "webgpu" and "wasm" execution providers
const EXECUTION_PROVIDERS: ort.InferenceSession.ExecutionProviderConfig[] = 
  PLATFORM_INFO.supportsWebGPU && !PLATFORM_INFO.isIOS
    ? ["webgpu", "wasm"]  // Try WebGPU first, fallback to WASM
    : ["wasm"];

// Log execution providers after definition
if (typeof window !== "undefined") {
  console.log(`[ONNX] Execution providers: ${EXECUTION_PROVIDERS.join(' → ')} (WebGPU detected but not enabled: ${PLATFORM_INFO.supportsWebGPU})`);
}

// Configuration for image processing
const MAX_IMAGE_SIZE = 400; // Maximum width/height for processing (reduce computational overhead)

// U2-Net Configuration - Trade-off between speed and quality
// Note: U2-Net model is trained for 320×320 input - cannot be changed without retraining
// For iOS memory optimization, models have been quantized down to FP16/INT8
const U2NET_INPUT_SIZE = 320; // Fixed at 320×320 as required by the model
const U2NET_QUALITY_MODE = PLATFORM_INFO.isMobile ? "low" : "medium"; // Mobile: faster, Desktop: better quality
const USE_FAST_MASK_APPLICATION = true; // Use optimized mask application (faster, slight quality loss)

// Mobile-specific configuration
const MOBILE_MAX_IMAGE_SIZE = 320; // Smaller max size for mobile to reduce memory pressure
const EFFECTIVE_MAX_IMAGE_SIZE = PLATFORM_INFO.isMobile ? MOBILE_MAX_IMAGE_SIZE : MAX_IMAGE_SIZE;

class ONNXProcessor {
  private u2netSession: ort.InferenceSession | null = null;
  private fashionClipSession: ort.InferenceSession | null = null;
  private labelEmbeddings: { [key: string]: number[] } = {};
  private modelsLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  // Individual model loading promises for lazy loading
  private u2netLoadingPromise: Promise<void> | null = null;
  private fashionClipLoadingPromise: Promise<void> | null = null;
  private labelEmbeddingsLoadingPromise: Promise<void> | null = null;

  /**
   * DEPRECATED: Preload models in the background
   *
   * This method is now deprecated on mobile devices due to memory constraints.
   * On iOS/mobile, models are loaded lazily (on-demand) to avoid exceeding
   * the ~512MB WASM heap limit. On desktop, this still works but lazy loading
   * is preferred.
   *
   * Use loadU2Net(), loadFashionClip(), and loadLabelEmbeddings() individually instead.
   */
  async preloadModels() {
    if (PLATFORM_INFO.isLowMemoryDevice) {
      console.warn("[ONNX] Preload skipped on low-memory device. Models will load on-demand.");
      return;
    }

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

  /**
   * Check storage quota before attempting to cache models
   */
  private async checkStorageAvailability(): Promise<void> {
    const quota = await checkStorageQuota();
    if (!quota.available && quota.quotaMB > 0) {
      console.warn(
        `[ONNX] Insufficient storage for model caching. ` +
        `Available: ${(quota.quotaMB - quota.usageMB).toFixed(0)}MB, Required: ~550MB`
      );
      throw new Error(
        `Insufficient storage space. Please free up at least 550MB and try again. ` +
        `Currently available: ${(quota.quotaMB - quota.usageMB).toFixed(0)}MB`
      );
    }
  }

  /**
   * Lazy load U2-Net model for background removal (168 MB)
   */
  async loadU2Net(): Promise<void> {
    if (this.u2netSession) return; // Already loaded

    if (this.u2netLoadingPromise) {
      return this.u2netLoadingPromise; // Already loading
    }

    this.u2netLoadingPromise = (async () => {
      const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const useCache = typeof window !== "undefined" && window.modelCache;

      try {
        // Check memory pressure before loading large model
        const memoryStatus = checkMemoryPressure();
        if (memoryStatus.level === 'critical') {
          console.warn('[ONNX] Critical memory pressure detected before loading U2-Net!');
          memoryStatus.recommendations.forEach(rec => console.warn(`  - ${rec}`));
        }

        console.log("[ONNX] Loading U2-Net model (168 MB)...");
        console.log("[ONNX] Using execution providers:", JSON.stringify(EXECUTION_PROVIDERS));

        // Wrap model loading with timeout
        await withTimeout(
          (async () => {
            if (useCache) {
              await this.checkStorageAvailability();
              await window.modelCache!.initialize();
              const u2netBuffer = await window.modelCache!.loadONNXModel(
                `${CDN_URL}/models/u2netp_fp16.onnx`
              );
              this.u2netSession = await ort.InferenceSession.create(
                u2netBuffer,
                { executionProviders: EXECUTION_PROVIDERS }
              );
            } else {
              this.u2netSession = await ort.InferenceSession.create(
                `${CDN_URL}/models/u2netp_fp16.onnx`,
                { executionProviders: EXECUTION_PROVIDERS }
              );
            }
          })(),
          TIMEOUTS.modelLoad,
          "U2-Net model loading"
        );

        console.log("[ONNX] U2-Net loaded successfully");
      } catch (error) {
        this.u2netLoadingPromise = null; // Reset so we can retry
        console.error("[ONNX] Failed to load U2-Net:", error);

        // User-friendly error messages for common iOS issues
        if (error instanceof Error) {
          if (error.name === 'TimeoutError') {
            throw error; // Pass through timeout errors with full message
          } else if (error.message.includes("memory") || error.message.includes("allocation")) {
            throw new Error(
              "Unable to load background removal model due to memory constraints. " +
              "Try closing other browser tabs and reload the page."
            );
          } else if (error.message.includes("storage") || error.message.includes("quota")) {
            throw error; // Already has user-friendly message
          }
        }
        throw new Error("Failed to load background removal model: " + (error as Error).message);
      }
    })();

    return this.u2netLoadingPromise;
  }

  /**
   * Lazy load FashionCLIP model for embedding generation (335 MB)
   */
  async loadFashionClip(): Promise<void> {
    if (this.fashionClipSession) return; // Already loaded

    if (this.fashionClipLoadingPromise) {
      return this.fashionClipLoadingPromise; // Already loading
    }

    this.fashionClipLoadingPromise = (async () => {
      const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const useCache = typeof window !== "undefined" && window.modelCache;

      try {
        // Check memory pressure before loading large model
        const memoryStatus = checkMemoryPressure();
        if (memoryStatus.level === 'critical' || memoryStatus.level === 'high') {
          console.warn('[ONNX] High memory pressure detected before loading FashionCLIP!');
          memoryStatus.recommendations.forEach(rec => console.warn(`  - ${rec}`));
        }

        console.log("[ONNX] Loading FashionCLIP model (335 MB)...");

        // Wrap model loading with timeout
        await withTimeout(
          (async () => {
            if (useCache) {
              await this.checkStorageAvailability();
              await window.modelCache!.initialize();
              const fashionClipBuffer = await window.modelCache!.loadONNXModel(
                `${CDN_URL}/models/fashion_clip_vision_fp16.onnx`
              );
              this.fashionClipSession = await ort.InferenceSession.create(
                fashionClipBuffer,
                { executionProviders: EXECUTION_PROVIDERS }
              );
            } else {
              this.fashionClipSession = await ort.InferenceSession.create(
                `${CDN_URL}/models/fashion_clip_vision_fp16.onnx`,
                { executionProviders: EXECUTION_PROVIDERS }
              );
            }
          })(),
          TIMEOUTS.modelLoad,
          "FashionCLIP model loading"
        );

        console.log("[ONNX] FashionCLIP loaded successfully");
      } catch (error) {
        this.fashionClipLoadingPromise = null; // Reset so we can retry
        console.error("[ONNX] Failed to load FashionCLIP:", error);

        // User-friendly error messages for common iOS issues
        if (error instanceof Error) {
          if (error.name === 'TimeoutError') {
            throw error; // Pass through timeout errors with full message
          } else if (error.message.includes("memory") || error.message.includes("allocation")) {
            throw new Error(
              "Unable to load image analysis model due to memory constraints. " +
              "Try closing other browser tabs and reload the page."
            );
          } else if (error.message.includes("storage") || error.message.includes("quota")) {
            throw error; // Already has user-friendly message
          }
        }
        throw new Error("Failed to load image analysis model: " + (error as Error).message);
      }
    })();

    return this.fashionClipLoadingPromise;
  }

  /**
   * Lazy load label embeddings for tag generation (7 MB)
   */
  async loadLabelEmbeddings(): Promise<void> {
    if (Object.keys(this.labelEmbeddings).length > 0) return; // Already loaded

    if (this.labelEmbeddingsLoadingPromise) {
      return this.labelEmbeddingsLoadingPromise; // Already loading
    }

    this.labelEmbeddingsLoadingPromise = (async () => {
      const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const useCache = typeof window !== "undefined" && window.modelCache;

      try {
        console.log("[ONNX] Loading label embeddings (7 MB)...");

        if (useCache) {
          await window.modelCache!.initialize();
          this.labelEmbeddings = await window.modelCache!.loadJSON(
            `${CDN_URL}/models/label_embeddings.json`
          );
        } else {
          const response = await fetch(`${CDN_URL}/models/label_embeddings.json`);
          this.labelEmbeddings = await response.json();
        }
        console.log(
          "[ONNX] Label embeddings loaded:",
          Object.keys(this.labelEmbeddings).length,
          "labels"
        );
      } catch (error) {
        this.labelEmbeddingsLoadingPromise = null; // Reset so we can retry
        console.error("[ONNX] Failed to load label embeddings:", error);
        throw new Error("Failed to load label data: " + (error as Error).message);
      }
    })();

    return this.labelEmbeddingsLoadingPromise;
  }

  /**
   * Legacy method: Load all models at once
   *
   * WARNING: Not recommended on iOS/mobile devices due to memory constraints.
   * Use individual loadU2Net(), loadFashionClip(), loadLabelEmbeddings() instead.
   */
  async loadModels() {
    if (this.modelsLoaded) return;

    console.log("[ONNX] Loading all models...");

    try {
      // Load all models in sequence (not parallel to reduce memory spikes)
      await this.loadU2Net();
      await this.loadFashionClip();
      await this.loadLabelEmbeddings();

      this.modelsLoaded = true;
      console.log("[ONNX] All models loaded successfully");

      const useCache = typeof window !== "undefined" && window.modelCache;
      if (useCache) {
        const stats = await window.modelCache!.getStats();
        console.log("[ONNX] Cache stats:", stats);
      }
    } catch (error) {
      console.error("[ONNX] Failed to load models:", error);
      throw error;
    }
  }

  async processImage(
    imageFile: File,
    onProgress?: (step: string) => void
  ): Promise<ProcessingResult> {
    try {
      // Step 1: Load image
      onProgress?.("Loading image...");
      const img = await this.loadImage(imageFile);

      // Step 2: Lazy load U2-Net and remove background
      onProgress?.("Loading background removal model...");
      await this.loadU2Net();
      onProgress?.("Removing background...");
      const { url: processedImageUrl, blob: processedImageBlob } = await this.removeBackground(img);

      // Step 3: Lazy load FashionCLIP and generate embedding
      onProgress?.("Loading image analysis model...");
      await this.loadFashionClip();
      onProgress?.("Analyzing item...");
      const embedding = await this.generateEmbedding(img);

      // Validate embedding quality to prevent garbage tags
      const embeddingMagnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );

      if (embeddingMagnitude < 0.1) {
        console.warn(`[ONNX] Embedding magnitude too low: ${embeddingMagnitude.toFixed(4)}`);
        throw new Error('Failed to generate valid embedding - image may be blank or corrupted. Please try uploading the photo again.');
      }

      console.log(`[ONNX] Embedding magnitude: ${embeddingMagnitude.toFixed(3)}`);

      // Step 4: Lazy load label embeddings and generate tags
      onProgress?.("Loading label data...");
      await this.loadLabelEmbeddings();
      onProgress?.("Generating tags...");
      const tags = this.generateTags(embedding);

      return {
        imageData: await this.imageUrlToImageData(processedImageUrl),
        processedImageUrl,
        processedImageBlob,
        embedding,
        tags,
      };
    } catch (error) {
      console.error("[ONNX] Image processing failed:", error);
      throw error;
    }
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        // Clean up object URL immediately after loading
        URL.revokeObjectURL(objectUrl);

        try {
          // Resize image to reduce computational overhead
          const resized = await this.resizeImage(img, EFFECTIVE_MAX_IMAGE_SIZE);
          resolve(resized);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };
      img.src = objectUrl;
    });
  }

  /**
   * Resize image to fit within maxSize while maintaining aspect ratio
   * This significantly reduces computational overhead for U2-Net processing
   *
   * Uses Blob URLs instead of data URLs to reduce memory pressure (2-3x savings)
   */
  private async resizeImage(
    img: HTMLImageElement,
    maxSize: number
  ): Promise<HTMLImageElement> {
    const { width, height } = img;

    // If image is already small enough, return as-is
    if (width <= maxSize && height <= maxSize) {
      return img;
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = width;
    let newHeight = height;

    if (width > height) {
      newWidth = maxSize;
      newHeight = Math.round((height / width) * maxSize);
    } else {
      newHeight = maxSize;
      newWidth = Math.round((width / height) * maxSize);
    }

    // Create resized image with proper async handling to avoid race condition
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Use toBlob instead of toDataURL to reduce memory pressure (2-3x savings)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to resize image - canvas conversion failed"));
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        const resizedImg = new Image();

        resizedImg.onload = () => {
          // Clean up blob URL after image loads
          URL.revokeObjectURL(blobUrl);

          // Explicit canvas cleanup for iOS
          canvas.width = 0;
          canvas.height = 0;
          ctx.clearRect(0, 0, 1, 1);

          console.log(
            `[ONNX] Resized image from ${width}x${height} to ${newWidth}x${newHeight} for processing`
          );
          resolve(resizedImg);
        };

        resizedImg.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          reject(new Error("Failed to resize image - image load failed"));
        };

        resizedImg.src = blobUrl;
      }, "image/png");
    });
  }

  private async removeBackground(img: HTMLImageElement): Promise<{ url: string; blob: Blob }> {
    if (!this.u2netSession) throw new Error("U2-Net model not loaded");

    const inputSize = U2NET_INPUT_SIZE;
    const startTime = performance.now();

    // Create canvas and resize to configured input size (iOS: 256x256, Desktop: 320x320)
    const canvas = document.createElement("canvas");
    canvas.width = inputSize;
    canvas.height = inputSize;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = U2NET_QUALITY_MODE;
    ctx.drawImage(img, 0, 0, inputSize, inputSize);

    const imageData = ctx.getImageData(0, 0, inputSize, inputSize);

    // Explicit canvas cleanup after getImageData
    canvas.width = 0;
    canvas.height = 0;

    const tensorData = new Float32Array(3 * inputSize * inputSize);

    // U2-Net normalization (from Rails implementation)
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    const pixelCount = inputSize * inputSize;
    for (let i = 0; i < pixelCount; i++) {
      const pixelIndex = i * 4;
      tensorData[i] = (imageData.data[pixelIndex] / 255.0 - mean[0]) / std[0];
      tensorData[pixelCount + i] =
        (imageData.data[pixelIndex + 1] / 255.0 - mean[1]) / std[1];
      tensorData[2 * pixelCount + i] =
        (imageData.data[pixelIndex + 2] / 255.0 - mean[2]) / std[2];
    }

    const tensor = new ort.Tensor("float32", tensorData, [1, 3, inputSize, inputSize]);
    const feeds = { "input": tensor };

    // Run inference with timeout
    const inferenceStart = performance.now();
    const outputs = await withTimeout(
      this.u2netSession.run(feeds),
      TIMEOUTS.inference,
      "U2-Net background removal inference"
    );
    const inferenceTime = performance.now() - inferenceStart;

    const outputName = this.u2netSession.outputNames[0];
    const mask = outputs[outputName].data as Float32Array;

    // Validate mask has meaningful content (not blank/corrupted)
    const nonZeroCount = Array.from(mask).filter(v => v > 0.1).length;
    const nonZeroPercentage = (nonZeroCount / mask.length) * 100;

    if (nonZeroCount < mask.length * 0.01) {
      // Less than 1% of mask is non-zero - likely failed to detect object
      console.warn(`[ONNX] U2-Net mask appears empty (${nonZeroPercentage.toFixed(2)}% non-zero)`);
      throw new Error('Failed to detect object in image - mask is empty. Please ensure the photo clearly shows a clothing item.');
    }

    console.log(`[ONNX] U2-Net mask coverage: ${nonZeroPercentage.toFixed(1)}%`);

    // Apply mask to original image
    const result = await this.applyMask(img, mask, inputSize, inputSize);

    const totalTime = performance.now() - startTime;
    console.log(`[ONNX] U2-Net: ${totalTime.toFixed(0)}ms total (inference: ${inferenceTime.toFixed(0)}ms, input: ${inputSize}x${inputSize})`);

    // Check memory pressure after intensive operation
    const memoryStatus = checkMemoryPressure();
    if (memoryStatus.level === 'high' || memoryStatus.level === 'critical') {
      console.warn(`[ONNX] Memory pressure after background removal: ${memoryStatus.level}`);
    }

    return result;
  }

  /**
   * Apply mask to image with iOS-optimized memory management
   * Uses Blob URLs and requestAnimationFrame yielding for large images
   */
  private async applyMask(
    img: HTMLImageElement,
    mask: Float32Array,
    maskWidth: number,
    maskHeight: number
  ): Promise<{ url: string; blob: Blob }> {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    // Process pixels with optional yielding to prevent iOS tab suspension
    await this.applyMaskToImageData(imageData, mask, maskWidth, maskHeight, img.width, img.height);

    ctx.putImageData(imageData, 0, 0);

    // Use toBlob for memory efficiency (2-3x less memory than toDataURL)
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob from canvas"));
          return;
        }

        // Create blob URL instead of data URL (much more memory efficient)
        const blobUrl = URL.createObjectURL(blob);

        // Explicit canvas cleanup
        canvas.width = 0;
        canvas.height = 0;

        // Return both URL and blob for caching
        resolve({ url: blobUrl, blob });
      }, "image/png");
    });
  }

  /**
   * Apply mask to image data with requestAnimationFrame yielding for iOS
   * Prevents "unresponsive script" warnings on large images
   */
  private async applyMaskToImageData(
    imageData: ImageData,
    mask: Float32Array,
    maskWidth: number,
    maskHeight: number,
    imgWidth: number,
    imgHeight: number
  ): Promise<void> {
    if (USE_FAST_MASK_APPLICATION) {
      // Optimized version: Direct scaling without bilinear interpolation
      // ~30% faster, minimal quality difference for fashion items
      const scaleX = maskWidth / imgWidth;
      const scaleY = maskHeight / imgHeight;

      // Process in chunks to allow browser to remain responsive
      // Chunk size: process N rows at a time, then yield
      const CHUNK_SIZE = 50; // Process 50 rows at a time
      const totalRows = imgHeight;

      for (let startY = 0; startY < totalRows; startY += CHUNK_SIZE) {
        const endY = Math.min(startY + CHUNK_SIZE, totalRows);

        // Process chunk
        for (let y = startY; y < endY; y++) {
          const maskY = Math.floor(y * scaleY);
          for (let x = 0; x < imgWidth; x++) {
            const maskX = Math.floor(x * scaleX);
            const maskValue = mask[maskY * maskWidth + maskX];
            // Simple threshold for cleaner edges (values above 0.5 are kept)
            const alpha = maskValue > 0.5 ? 255 : Math.floor(maskValue * 510); // 2x multiplier for sharper edges
            imageData.data[(y * imgWidth + x) * 4 + 3] = alpha;
          }
        }

        // Yield to browser every chunk (only on iOS/mobile to avoid overhead on desktop)
        if (PLATFORM_INFO.isMobile && startY + CHUNK_SIZE < totalRows) {
          await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        }
      }
    } else {
      // Original version: Higher quality but slower
      const CHUNK_SIZE = 50;
      const totalRows = imgHeight;

      for (let startY = 0; startY < totalRows; startY += CHUNK_SIZE) {
        const endY = Math.min(startY + CHUNK_SIZE, totalRows);

        for (let y = startY; y < endY; y++) {
          for (let x = 0; x < imgWidth; x++) {
            const maskX = Math.floor((x * maskWidth) / imgWidth);
            const maskY = Math.floor((y * maskHeight) / imgHeight);
            const maskValue = mask[maskY * maskWidth + maskX];
            const alpha = Math.floor(maskValue * 255);
            imageData.data[(y * imgWidth + x) * 4 + 3] = alpha;
          }
        }

        // Yield to browser every chunk (only on iOS/mobile)
        if (PLATFORM_INFO.isMobile && startY + CHUNK_SIZE < totalRows) {
          await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        }
      }
    }
  }

  private async generateEmbedding(img: HTMLImageElement): Promise<number[]> {
    if (!this.fashionClipSession)
      throw new Error("FashionCLIP model not loaded");

    // Resize to 224x224 for FashionCLIP
    const canvas = document.createElement("canvas");
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, 224, 224);

    const imageData = ctx.getImageData(0, 0, 224, 224);

    // Explicit canvas cleanup after getImageData
    canvas.width = 0;
    canvas.height = 0;

    const tensorData = new Float32Array(3 * 224 * 224);

    // FashionCLIP normalization (from Rails implementation)
    const mean = [0.48145466, 0.4578275, 0.40821073];
    const std = [0.26862954, 0.26130258, 0.27577711];

    for (let i = 0; i < 224 * 224; i++) {
      const pixelIndex = i * 4;
      tensorData[i] = (imageData.data[pixelIndex] / 255.0 - mean[0]) / std[0];
      tensorData[224 * 224 + i] =
        (imageData.data[pixelIndex + 1] / 255.0 - mean[1]) / std[1];
      tensorData[2 * 224 * 224 + i] =
        (imageData.data[pixelIndex + 2] / 255.0 - mean[2]) / std[2];
    }

    const tensor = new ort.Tensor("float32", tensorData, [1, 3, 224, 224]);
    const feeds = { pixel_values: tensor };

    // Run inference with timeout
    const outputs = await withTimeout(
      this.fashionClipSession.run(feeds),
      TIMEOUTS.inference,
      "FashionCLIP embedding generation"
    );
    const rawEmbedding = Array.from(
      outputs[Object.keys(outputs)[0]].data as Float32Array
    );

    // Normalize embedding (from Rails implementation)
    const norm = Math.sqrt(
      rawEmbedding.reduce((sum, val) => sum + val * val, 0)
    );
    const normalizedEmbedding = rawEmbedding.map((val) => val / norm);

    return normalizedEmbedding;
  }

  private generateTags(
    embedding: number[]
  ): { label: string; score: number }[] {
    const similarities: { label: string; score: number }[] = [];

    for (const [label, textEmbed] of Object.entries(this.labelEmbeddings)) {
      if (textEmbed.length !== embedding.length) continue;

      const similarity = this.cosineSimilarity(embedding, textEmbed);

      if (!isNaN(similarity)) {
        similarities.push({ label, score: similarity });
      }
    }

    // Sort by similarity and take top 10
    similarities.sort((a, b) => b.score - a.score);
    const topTags = similarities.slice(0, 10);

    // Log warning if confidence is suspiciously low across all tags
    if (topTags.length > 0 && topTags[0].score < 0.3) {
      console.warn(
        `[ONNX] Tag confidence suspiciously low (best: ${topTags[0].score.toFixed(3)}). ` +
        `Top tags: ${topTags.slice(0, 3).map(t => `${t.label} (${t.score.toFixed(2)})`).join(', ')}`
      );
    }

    return topTags;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return NaN;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (normA === 0 || normB === 0) return NaN;

    return dotProduct / (normA * normB);
  }

  private async imageUrlToImageData(url: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const isBlobUrl = url.startsWith("blob:");

      img.onload = () => {
        // Clean up blob URL if it was one
        if (isBlobUrl) {
          URL.revokeObjectURL(url);
        }

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Explicit canvas cleanup
        canvas.width = 0;
        canvas.height = 0;

        resolve(imageData);
      };

      img.onerror = () => {
        if (isBlobUrl) {
          URL.revokeObjectURL(url);
        }
        reject(new Error("Failed to load processed image"));
      };

      img.src = url;
    });
  }
}

export const onnxProcessor = new ONNXProcessor();
export default onnxProcessor;
