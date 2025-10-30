// Client-side ONNX model processing

import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime
if (typeof window !== 'undefined') {
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
}

export interface ProcessingResult {
  imageData: ImageData;
  embedding: number[];
  tags: string[];
}

class ONNXProcessor {
  private u2netSession: ort.InferenceSession | null = null;
  private fashionClipSession: ort.InferenceSession | null = null;
  private labelEmbeddings: { [key: string]: number[] } = {};
  private modelsLoaded = false;

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      // Load U2-Net for background removal
      this.u2netSession = await ort.InferenceSession.create(
        'http://localhost:3000/models/u2net.onnx'
      );

      // Load FashionCLIP image encoder
      this.fashionClipSession = await ort.InferenceSession.create(
        'http://localhost:3000/models/fashionclip_image_encoder.onnx'
      );

      // Load label embeddings
      const response = await fetch('http://localhost:3000/models/label_embeddings.json');
      this.labelEmbeddings = await response.json();

      this.modelsLoaded = true;
      console.log('ONNX models loaded successfully');
    } catch (error) {
      console.error('Failed to load ONNX models:', error);
      throw new Error('Failed to load AI models');
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
      onProgress?.('Loading image...');
      const imageData = await this.loadImageData(imageFile);

      // Step 2: Remove background
      onProgress?.('Removing background...');
      const processedImage = await this.removeBackground(imageData);

      // Step 3: Generate embedding
      onProgress?.('Analyzing item...');
      const embedding = await this.generateEmbedding(processedImage);

      // Step 4: Generate tags
      onProgress?.('Generating tags...');
      const tags = this.generateTags(embedding);

      return {
        imageData: processedImage,
        embedding,
        tags,
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }

  private async loadImageData(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private async removeBackground(imageData: ImageData): Promise<ImageData> {
    if (!this.u2netSession) throw new Error('U2-Net model not loaded');

    // Resize to 320x320 for U2-Net
    const resized = this.resizeImageData(imageData, 320, 320);

    // Normalize and convert to tensor format
    const inputTensor = this.imageDataToTensor(resized);

    // Run inference
    const feeds: Record<string, ort.Tensor> = { input: inputTensor };
    const results = await this.u2netSession.run(feeds);

    // Get mask from output
    const maskTensor = results.output;

    // Apply mask to original image
    return this.applyMask(imageData, maskTensor);
  }

  private async generateEmbedding(imageData: ImageData): Promise<number[]> {
    if (!this.fashionClipSession) throw new Error('FashionCLIP model not loaded');

    // Resize to 224x224 for FashionCLIP
    const resized = this.resizeImageData(imageData, 224, 224);

    // Normalize and convert to tensor
    const inputTensor = this.imageDataToTensor(resized);

    // Run inference
    const feeds: Record<string, ort.Tensor> = { pixel_values: inputTensor };
    const results = await this.fashionClipSession.run(feeds);

    // Extract embedding from output
    const embeddingTensor = results.last_hidden_state;
    return Array.from(embeddingTensor.data as Float32Array);
  }

  private generateTags(embedding: number[]): string[] {
    // Calculate cosine similarity with label embeddings
    const similarities: { label: string; score: number }[] = [];

    for (const [label, labelEmb] of Object.entries(this.labelEmbeddings)) {
      const similarity = this.cosineSimilarity(embedding, labelEmb);
      similarities.push({ label, score: similarity });
    }

    // Sort by similarity and take top 10
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, 10).map(s => s.label);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private resizeImageData(imageData: ImageData, width: number, height: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }

  private imageDataToTensor(imageData: ImageData): ort.Tensor {
    const { width, height, data } = imageData;
    const floatData = new Float32Array(3 * width * height);

    // Convert RGBA to RGB and normalize to [-1, 1]
    for (let i = 0; i < width * height; i++) {
      floatData[i] = (data[i * 4] / 255.0 - 0.5) / 0.5; // R
      floatData[width * height + i] = (data[i * 4 + 1] / 255.0 - 0.5) / 0.5; // G
      floatData[width * height * 2 + i] = (data[i * 4 + 2] / 255.0 - 0.5) / 0.5; // B
    }

    return new ort.Tensor('float32', floatData, [1, 3, height, width]);
  }

  private applyMask(imageData: ImageData, maskTensor: ort.Tensor): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const maskData = maskTensor.data as Float32Array;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const pixelIndex = i / 4;
      const alpha = maskData[pixelIndex] > 0.5 ? 255 : 0;

      result.data[i] = imageData.data[i];     // R
      result.data[i + 1] = imageData.data[i + 1]; // G
      result.data[i + 2] = imageData.data[i + 2]; // B
      result.data[i + 3] = alpha;              // A
    }

    return result;
  }
}

export const onnxProcessor = new ONNXProcessor();
export default onnxProcessor;
