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

// Configure ONNX Runtime - WASM files copied from Rails to Next.js /public/
if (typeof window !== "undefined") {
  // Serve from Next.js public directory (correct MIME types)
  ort.env.wasm.wasmPaths = "/";

  // Single-threaded WASM with SIMD support
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;

  // Disable proxy
  ort.env.wasm.proxy = false;

  // Suppress ONNX Runtime warnings to prevent Next.js dev overlay spam
  ort.env.logLevel = "error"; // Only show errors, not warnings

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
  embedding: number[];
  tags: { label: string; score: number }[];
}

// Configuration for image processing
const MAX_IMAGE_SIZE = 400; // Maximum width/height for processing (reduce computational overhead)

// U2-Net Configuration - Trade-off between speed and quality
const U2NET_INPUT_SIZE = 256; // Reduced from 320 for ~50% faster processing (was 320)
const U2NET_QUALITY_MODE = "medium"; // "low" | "medium" | "high" - affects smoothing quality
const USE_FAST_MASK_APPLICATION = true; // Use optimized mask application (faster, slight quality loss)

class ONNXProcessor {
  private u2netSession: ort.InferenceSession | null = null;
  private fashionClipSession: ort.InferenceSession | null = null;
  private labelEmbeddings: { [key: string]: number[] } = {};
  private modelsLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Preload models in the background - call this early (e.g., on demo start)
   * to avoid waiting during image processing
   */
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

  async loadModels() {
    if (this.modelsLoaded) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const useCache = typeof window !== "undefined" && window.modelCache;

    try {
      console.log("[ONNX] Loading models from", API_URL);

      if (useCache) {
        console.log("[ONNX] Using IndexedDB cache for persistent storage");
        await window.modelCache!.initialize();
      }

      // Load U2-Net for background removal
      if (useCache) {
        const u2netBuffer = await window.modelCache!.loadONNXModel(
          `${API_URL}/models/u2net.onnx`
        );
        this.u2netSession = await ort.InferenceSession.create(
          u2netBuffer,
          { executionProviders: ["wasm"] }
        );
      } else {
        this.u2netSession = await ort.InferenceSession.create(
          `${API_URL}/models/u2net.onnx`,
          { executionProviders: ["wasm"] }
        );
      }
      console.log("[ONNX] U2-Net loaded");

      // Load FashionCLIP image encoder
      if (useCache) {
        const fashionClipBuffer = await window.modelCache!.loadONNXModel(
          `${API_URL}/models/fashionclip_image_encoder.onnx`
        );
        this.fashionClipSession = await ort.InferenceSession.create(
          fashionClipBuffer,
          { executionProviders: ["wasm"] }
        );
      } else {
        this.fashionClipSession = await ort.InferenceSession.create(
          `${API_URL}/models/fashionclip_image_encoder.onnx`,
          { executionProviders: ["wasm"] }
        );
      }
      console.log("[ONNX] FashionCLIP loaded");

      // Load label embeddings
      if (useCache) {
        this.labelEmbeddings = await window.modelCache!.loadJSON(
          `${API_URL}/models/label_embeddings.json`
        );
      } else {
        const response = await fetch(`${API_URL}/models/label_embeddings.json`);
        this.labelEmbeddings = await response.json();
      }
      console.log(
        "[ONNX] Label embeddings loaded:",
        Object.keys(this.labelEmbeddings).length,
        "labels"
      );

      this.modelsLoaded = true;
      console.log("[ONNX] All models loaded successfully");

      if (useCache) {
        const stats = await window.modelCache!.getStats();
        console.log("[ONNX] Cache stats:", stats);
      }
    } catch (error) {
      console.error("[ONNX] Failed to load models:", error);
      throw new Error("Failed to load AI models: " + (error as Error).message);
    }
  }

  async processImage(
    imageFile: File,
    onProgress?: (step: string) => void
  ): Promise<ProcessingResult> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      // Step 1: Load image
      onProgress?.("Loading image...");
      const img = await this.loadImage(imageFile);

      // Step 2: Remove background
      onProgress?.("Removing background...");
      const processedImageUrl = await this.removeBackground(img);

      // Step 3: Generate embedding
      onProgress?.("Analyzing item...");
      const embedding = await this.generateEmbedding(img);

      // Step 4: Generate tags
      onProgress?.("Generating tags...");
      const tags = this.generateTags(embedding);

      return {
        imageData: await this.imageUrlToImageData(processedImageUrl),
        processedImageUrl,
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
      img.onload = () => {
        // Resize image to reduce computational overhead
        const resized = this.resizeImage(img, MAX_IMAGE_SIZE);
        resolve(resized);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Resize image to fit within maxSize while maintaining aspect ratio
   * This significantly reduces computational overhead for U2-Net processing
   */
  private resizeImage(
    img: HTMLImageElement,
    maxSize: number
  ): HTMLImageElement {
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

    // Create resized image
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Convert canvas to image
    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL("image/png");
    resizedImg.width = newWidth;
    resizedImg.height = newHeight;

    console.log(
      `[ONNX] Resized image from ${width}x${height} to ${newWidth}x${newHeight} for processing`
    );

    return resizedImg;
  }

  private async removeBackground(img: HTMLImageElement): Promise<string> {
    if (!this.u2netSession) throw new Error("U2-Net model not loaded");

    const inputSize = U2NET_INPUT_SIZE;
    const startTime = performance.now();

    // Create canvas and resize to configured input size (default 256x256, was 320x320)
    const canvas = document.createElement("canvas");
    canvas.width = inputSize;
    canvas.height = inputSize;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = U2NET_QUALITY_MODE;
    ctx.drawImage(img, 0, 0, inputSize, inputSize);

    const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
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
    const feeds = { "input.1": tensor };

    // Run inference
    const inferenceStart = performance.now();
    const outputs = await this.u2netSession.run(feeds);
    const inferenceTime = performance.now() - inferenceStart;

    const outputName = this.u2netSession.outputNames[0];
    const mask = outputs[outputName].data as Float32Array;

    // Apply mask to original image
    const result = this.applyMask(img, mask, inputSize, inputSize);

    const totalTime = performance.now() - startTime;
    console.log(`[ONNX] U2-Net: ${totalTime.toFixed(0)}ms total (inference: ${inferenceTime.toFixed(0)}ms, input: ${inputSize}x${inputSize})`);

    return result;
  }

  private applyMask(
    img: HTMLImageElement,
    mask: Float32Array,
    maskWidth: number,
    maskHeight: number
  ): string {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    if (USE_FAST_MASK_APPLICATION) {
      // Optimized version: Direct scaling without bilinear interpolation
      // ~30% faster, minimal quality difference for fashion items
      const scaleX = maskWidth / img.width;
      const scaleY = maskHeight / img.height;

      for (let y = 0; y < img.height; y++) {
        const maskY = Math.floor(y * scaleY);
        for (let x = 0; x < img.width; x++) {
          const maskX = Math.floor(x * scaleX);
          const maskValue = mask[maskY * maskWidth + maskX];
          // Simple threshold for cleaner edges (values above 0.5 are kept)
          const alpha = maskValue > 0.5 ? 255 : Math.floor(maskValue * 510); // 2x multiplier for sharper edges
          imageData.data[(y * img.width + x) * 4 + 3] = alpha;
        }
      }
    } else {
      // Original version: Higher quality but slower
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const maskX = Math.floor((x * maskWidth) / img.width);
          const maskY = Math.floor((y * maskHeight) / img.height);
          const maskValue = mask[maskY * maskWidth + maskX];
          const alpha = Math.floor(maskValue * 255);
          imageData.data[(y * img.width + x) * 4 + 3] = alpha;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
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

    // Run inference
    const outputs = await this.fashionClipSession.run(feeds);
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
    return similarities.slice(0, 10);
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
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.onerror = () => reject(new Error("Failed to load processed image"));
      img.src = url;
    });
  }
}

export const onnxProcessor = new ONNXProcessor();
export default onnxProcessor;
