/**
 * YOLO Clothing Detection Module
 * Detects clothing items and provides bounding boxes for cropping
 */

class YOLODetector {
  constructor() {
    this.session = null;
    this.config = null;
    this.modelLoaded = false;
  }

  /**
   * Initialize YOLO detector
   */
  async initialize() {
    console.log("[YOLO] Initializing detector...");

    try {
      // Load configuration
      const configResponse = await fetch("/models/yolo_config.json");
      this.config = await configResponse.json();
      console.log("[YOLO] Config loaded:", this.config.model_info.name);

      // Load ONNX model
      this.session = await ort.InferenceSession.create(
        "/models/yolo_raincoat.onnx",
        {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        }
      );

      this.modelLoaded = true;
      console.log("[YOLO] Model loaded successfully");

      return true;
    } catch (error) {
      console.error("[YOLO] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Preprocess image for YOLO
   * @param {HTMLImageElement|HTMLCanvasElement} image - Input image
   * @returns {Object} - Preprocessed tensor and metadata
   */
  preprocessImage(image) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const targetSize = 640;
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Calculate scaling to maintain aspect ratio (letterbox)
    const scale = Math.min(targetSize / image.width, targetSize / image.height);

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    // Center the image (letterbox padding)
    const x = (targetSize - scaledWidth) / 2;
    const y = (targetSize - scaledHeight) / 2;

    // Fill with gray background
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, targetSize, targetSize);

    // Draw scaled image
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

    // Get image data
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
    const pixels = imageData.data;

    // Convert to normalized RGB tensor [1, 3, 640, 640]
    const tensor = new Float32Array(1 * 3 * targetSize * targetSize);

    for (let i = 0; i < targetSize * targetSize; i++) {
      tensor[i] = pixels[i * 4] / 255.0; // R
      tensor[targetSize * targetSize + i] = pixels[i * 4 + 1] / 255.0; // G
      tensor[targetSize * targetSize * 2 + i] = pixels[i * 4 + 2] / 255.0; // B
    }

    return {
      tensor: new ort.Tensor("float32", tensor, [1, 3, targetSize, targetSize]),
      scale: scale,
      offsetX: x,
      offsetY: y,
      originalWidth: image.width,
      originalHeight: image.height,
    };
  }

  /**
   * Post-process YOLO output
   * @param {Float32Array} output - Raw model output
   * @param {Object} metadata - Preprocessing metadata
   * @returns {Array} - Detected items with bboxes
   */
  postprocessOutput(output, metadata) {
    const detections = [];
    const numDetections = 8400; // YOLOv8 outputs 8400 predictions
    const numClasses = 5;

    // YOLOv8 output format: [1, 84, 8400]
    // 84 = 4 (bbox) + 80 (COCO classes, but we only use first 5)

    for (let i = 0; i < numDetections; i++) {
      // Get class scores for our 5 categories
      const classScores = [];
      for (let c = 0; c < numClasses; c++) {
        const scoreIndex = (4 + c) * numDetections + i;
        classScores.push(output[scoreIndex]);
      }

      // Find best class
      const maxScore = Math.max(...classScores);
      const classId = classScores.indexOf(maxScore);

      // Filter by confidence threshold
      if (maxScore >= this.config.postprocessing.confidence_threshold) {
        // Get bbox coordinates (xyxy format)
        const x1 = output[i];
        const y1 = output[numDetections + i];
        const x2 = output[2 * numDetections + i];
        const y2 = output[3 * numDetections + i];

        // Convert from 640x640 model space back to original image space
        const bbox = this.convertBboxToOriginal({ x1, y1, x2, y2 }, metadata);

        const area = (bbox.x2 - bbox.x1) * (bbox.y2 - bbox.y1);

        detections.push({
          category: this.config.categories[classId],
          categoryId: classId,
          confidence: maxScore,
          bbox: bbox,
          area: area,
        });
      }
    }

    // Apply NMS (Non-Maximum Suppression)
    const filteredDetections = this.applyNMS(
      detections,
      this.config.postprocessing.iou_threshold
    );

    // Sort by area (largest first) then confidence
    filteredDetections.sort((a, b) => {
      if (Math.abs(b.area - a.area) > 1000) {
        return b.area - a.area;
      }
      return b.confidence - a.confidence;
    });

    return filteredDetections;
  }

  /**
   * Convert bbox from model space to original image space
   */
  convertBboxToOriginal(bbox, metadata) {
    const { scale, offsetX, offsetY, originalWidth, originalHeight } = metadata;

    // Remove letterbox offset and undo scaling
    const x1 = (bbox.x1 - offsetX) / scale;
    const y1 = (bbox.y1 - offsetY) / scale;
    const x2 = (bbox.x2 - offsetX) / scale;
    const y2 = (bbox.y2 - offsetY) / scale;

    // Clamp to image bounds
    return {
      x1: Math.max(0, Math.min(x1, originalWidth)),
      y1: Math.max(0, Math.min(y1, originalHeight)),
      x2: Math.max(0, Math.min(x2, originalWidth)),
      y2: Math.max(0, Math.min(y2, originalHeight)),
    };
  }

  /**
   * Apply Non-Maximum Suppression
   */
  applyNMS(detections, iouThreshold) {
    if (detections.length === 0) return [];

    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    const keep = [];
    const suppressed = new Set();

    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;

      keep.push(detections[i]);

      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;

        const iou = this.calculateIOU(detections[i].bbox, detections[j].bbox);

        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }

    return keep;
  }

  /**
   * Calculate Intersection over Union
   */
  calculateIOU(bbox1, bbox2) {
    const x1 = Math.max(bbox1.x1, bbox2.x1);
    const y1 = Math.max(bbox1.y1, bbox2.y1);
    const x2 = Math.min(bbox1.x2, bbox2.x2);
    const y2 = Math.min(bbox1.y2, bbox2.y2);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);

    const bbox1Area = (bbox1.x2 - bbox1.x1) * (bbox1.y2 - bbox1.y1);
    const bbox2Area = (bbox2.x2 - bbox2.x1) * (bbox2.y2 - bbox2.y1);

    const unionArea = bbox1Area + bbox2Area - intersectionArea;

    return intersectionArea / unionArea;
  }

  /**
   * Detect clothing items in image
   * @param {HTMLImageElement|HTMLCanvasElement} image - Input image
   * @returns {Promise<Array>} - Array of detections
   */
  async detect(image) {
    if (!this.modelLoaded) {
      throw new Error("YOLO model not loaded. Call initialize() first.");
    }

    console.log("[YOLO] Running detection...");
    const startTime = performance.now();

    try {
      // Preprocess
      const { tensor, ...metadata } = this.preprocessImage(image);

      // Run inference
      const feeds = { images: tensor };
      const results = await this.session.run(feeds);

      // Postprocess
      const output = results.output0.data;
      const detections = this.postprocessOutput(output, metadata);

      const elapsed = performance.now() - startTime;
      console.log(`[YOLO] Detection complete in ${elapsed.toFixed(0)}ms`);
      console.log(`[YOLO] Found ${detections.length} items`);

      return detections;
    } catch (error) {
      console.error("[YOLO] Detection failed:", error);
      throw error;
    }
  }

  /**
   * Crop image to bounding box
   * @param {HTMLImageElement|HTMLCanvasElement} image - Input image
   * @param {Object} bbox - Bounding box {x1, y1, x2, y2}
   * @param {number} padding - Padding percentage (0-1)
   * @returns {HTMLCanvasElement} - Cropped image
   */
  cropToBbox(image, bbox, padding = 0.05) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Add padding
    const width = bbox.x2 - bbox.x1;
    const height = bbox.y2 - bbox.y1;
    const padX = width * padding;
    const padY = height * padding;

    const x1 = Math.max(0, bbox.x1 - padX);
    const y1 = Math.max(0, bbox.y1 - padY);
    const x2 = Math.min(image.width, bbox.x2 + padX);
    const y2 = Math.min(image.height, bbox.y2 + padY);

    canvas.width = x2 - x1;
    canvas.height = y2 - y1;

    // Draw cropped region
    ctx.drawImage(
      image,
      x1,
      y1,
      x2 - x1,
      y2 - y1,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas;
  }

  /**
   * Visualize detections on image
   * @param {HTMLCanvasElement} canvas - Canvas to draw on
   * @param {Array} detections - Detection results
   */
  visualizeDetections(canvas, detections) {
    const ctx = canvas.getContext("2d");

    const colors = {
      top: "#FF6464",
      bottom: "#6464FF",
      outerwear: "#FFC864",
      shoes: "#64FF64",
      accessories: "#FF64FF",
    };

    detections.forEach((det) => {
      const color = colors[det.category] || "#888888";
      const { x1, y1, x2, y2 } = det.bbox;

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Draw label background
      const label = `${det.category} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = "bold 16px Arial";
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = color;
      ctx.fillRect(x1, y1 - 25, textWidth + 10, 25);

      // Draw label text
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(label, x1 + 5, y1 - 7);
    });
  }
}

// Export for use in other modules
window.YOLODetector = YOLODetector;
