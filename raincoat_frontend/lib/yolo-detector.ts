// YOLO Clothing Detection Module
// Based on raincoat_api/public/js/yolo_handler.js

import * as ort from 'onnxruntime-web';

export interface YOLODetection {
  category: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface YOLOConfig {
  model_info: {
    name: string;
    version: string;
    architecture: string;
    input_shape: number[];
    input_name: string;
    output_names: string[];
  };
  categories: { [key: string]: string };
  preprocessing: {
    resize: number[];
    normalize: boolean;
    letterbox: boolean;
    rgb: boolean;
  };
  postprocessing: {
    confidence_threshold: number;
    iou_threshold: number;
    max_detections: number;
  };
}

class YOLODetector {
  private session: ort.InferenceSession | null = null;
  private config: YOLOConfig | null = null;
  private modelLoaded = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize YOLO detector
   */
  async initialize() {
    // If already loaded, return immediately
    if (this.modelLoaded) {
      console.log('[YOLO] Already initialized, skipping...');
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      console.log('[YOLO] Initialization in progress, waiting...');
      return this.initializationPromise;
    }

    // Start new initialization
    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize() {
    // Use CDN URL for models, fallback to API URL if not set
    const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('[YOLO] Initializing detector from', CDN_URL);

    try {
      // Load configuration
      const configResponse = await fetch(`${CDN_URL}/models/yolo_config.json`);
      this.config = await configResponse.json();
      console.log('[YOLO] Config loaded:', this.config?.model_info?.name);

      // Load ONNX model with same settings as U2-Net/FashionCLIP
      console.log('[YOLO] Loading ONNX model...');
      this.session = await ort.InferenceSession.create(
        `${CDN_URL}/models/yolo_raincoat.onnx`,
        {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all'
        }
      );

      this.modelLoaded = true;
      this.initializationPromise = null;
      console.log('[YOLO] Model loaded successfully');
    } catch (error) {
      this.initializationPromise = null;
      console.error('[YOLO] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess image for YOLO
   */
  private preprocessImage(image: HTMLImageElement): { tensor: ort.Tensor; scale: number; xOffset: number; yOffset: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const targetSize = 640;
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Calculate scaling to maintain aspect ratio (letterbox)
    const scale = Math.min(targetSize / image.width, targetSize / image.height);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    // Center the image (letterbox padding)
    const xOffset = (targetSize - scaledWidth) / 2;
    const yOffset = (targetSize - scaledHeight) / 2;

    // Fill with gray background
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, targetSize, targetSize);

    // Draw image
    ctx.drawImage(image, xOffset, yOffset, scaledWidth, scaledHeight);

    // Get image data
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
    const pixels = imageData.data;

    // Convert to float32 tensor [1, 3, 640, 640] normalized to [0, 1]
    const float32Data = new Float32Array(3 * targetSize * targetSize);

    for (let i = 0; i < pixels.length / 4; i++) {
      float32Data[i] = pixels[i * 4] / 255.0;                           // R
      float32Data[targetSize * targetSize + i] = pixels[i * 4 + 1] / 255.0;  // G
      float32Data[2 * targetSize * targetSize + i] = pixels[i * 4 + 2] / 255.0;  // B
    }

    const tensor = new ort.Tensor('float32', float32Data, [1, 3, targetSize, targetSize]);

    return { tensor, scale, xOffset, yOffset };
  }

  /**
   * Perform NMS (Non-Maximum Suppression)
   */
  private nms(boxes: number[][], iouThreshold: number): number[][] {
    if (boxes.length === 0) return [];

    // Sort by confidence (descending)
    boxes.sort((a, b) => b[4] - a[4]);

    const keep: number[][] = [];

    while (boxes.length > 0) {
      const current = boxes[0];
      keep.push(current);
      boxes = boxes.slice(1);

      boxes = boxes.filter(box => {
        const iou = this.calculateIoU(current, box);
        return iou < iouThreshold;
      });
    }

    return keep;
  }

  /**
   * Calculate Intersection over Union
   */
  private calculateIoU(box1: number[], box2: number[]): number {
    const x1 = Math.max(box1[0], box2[0]);
    const y1 = Math.max(box1[1], box2[1]);
    const x2 = Math.min(box1[2], box2[2]);
    const y2 = Math.min(box1[3], box2[3]);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = (box1[2] - box1[0]) * (box1[3] - box1[1]);
    const area2 = (box2[2] - box2[0]) * (box2[3] - box2[1]);
    const union = area1 + area2 - intersection;

    return intersection / union;
  }

  /**
   * Detect clothing items in image
   */
  async detect(image: HTMLImageElement): Promise<YOLODetection[]> {
    if (!this.session || !this.config) {
      await this.initialize();
    }

    console.log('[YOLO] Running detection...');

    // Preprocess
    const { tensor, scale, xOffset, yOffset } = this.preprocessImage(image);

    // Run inference
    const results = await this.session!.run({ [this.config!.model_info.input_name]: tensor });
    const output = results[this.config!.model_info.output_names[0]];

    // Process output - YOLOv8 format: [1, 84, 8400] -> transpose to [8400, 84]
    const data = output.data as Float32Array;
    const numDetections = 8400;
    const numClasses = 5;

    const boxes: number[][] = [];

    // Parse detections
    for (let i = 0; i < numDetections; i++) {
      // Get box coordinates [x_center, y_center, width, height]
      const xCenter = data[i];
      const yCenter = data[numDetections + i];
      const width = data[2 * numDetections + i];
      const height = data[3 * numDetections + i];

      // Get class confidences
      let maxConf = 0;
      let maxClass = 0;

      for (let c = 0; c < numClasses; c++) {
        const conf = data[(4 + c) * numDetections + i];
        if (conf > maxConf) {
          maxConf = conf;
          maxClass = c;
        }
      }

      // Filter by confidence threshold
      if (maxConf > this.config!.postprocessing.confidence_threshold) {
        // Convert from letterbox coordinates to original image coordinates
        const x1 = ((xCenter - width / 2) - xOffset) / scale;
        const y1 = ((yCenter - height / 2) - yOffset) / scale;
        const x2 = ((xCenter + width / 2) - xOffset) / scale;
        const y2 = ((yCenter + height / 2) - yOffset) / scale;

        boxes.push([x1, y1, x2, y2, maxConf, maxClass]);
      }
    }

    console.log(`[YOLO] Found ${boxes.length} detections before NMS`);

    // Apply NMS
    const filtered = this.nms(boxes, this.config!.postprocessing.iou_threshold);

    console.log(`[YOLO] ${filtered.length} detections after NMS`);

    // Convert to detection objects
    const detections: YOLODetection[] = filtered.map(box => ({
      category: this.config!.categories[box[5].toString()],
      confidence: box[4],
      bbox: {
        x: Math.max(0, box[0]),
        y: Math.max(0, box[1]),
        width: box[2] - box[0],
        height: box[3] - box[1]
      }
    }));

    return detections;
  }

  /**
   * Crop image to bounding box with padding
   */
  cropToBbox(image: HTMLImageElement, bbox: YOLODetection['bbox'], paddingPercent: number = 0.05): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Add padding
    const padding = Math.max(bbox.width, bbox.height) * paddingPercent;
    const x = Math.max(0, bbox.x - padding);
    const y = Math.max(0, bbox.y - padding);
    const width = Math.min(image.width - x, bbox.width + 2 * padding);
    const height = Math.min(image.height - y, bbox.height + 2 * padding);

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      image,
      x, y, width, height,
      0, 0, width, height
    );

    return canvas.toDataURL('image/png');
  }

  /**
   * Draw detections on canvas
   */
  drawDetections(canvas: HTMLCanvasElement, image: HTMLImageElement, detections: YOLODetection[]) {
    const ctx = canvas.getContext('2d')!;

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw image
    ctx.drawImage(image, 0, 0);

    // Draw bounding boxes
    detections.forEach((det, idx) => {
      const { bbox, category, confidence } = det;

      // Draw box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

      // Draw label
      const label = `${category} ${(confidence * 100).toFixed(1)}%`;
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 16px Arial';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillRect(bbox.x, bbox.y - 25, textWidth + 10, 25);

      ctx.fillStyle = '#000';
      ctx.fillText(label, bbox.x + 5, bbox.y - 7);
    });
  }
}

export const yoloDetector = new YOLODetector();
export default yoloDetector;
