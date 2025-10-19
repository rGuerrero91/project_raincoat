/**
 * Enhanced Clothing Upload with YOLO Detection
 * Integrates with existing U2-Net and FashionCLIP pipeline
 */

class UploadClothing {
  constructor() {
    this.yoloDetector = null;
    this.u2netSession = null;
    this.fashionClipSession = null;
    this.labelEmbeddings = null;
    this.weatherRules = null;

    this.currentImageFile = null;
    this.currentImage = null;
    this.currentImageEmbedding = null;
    this.detections = [];
    this.selectedDetection = null;
    this.selectedDetectionIndex = undefined;
  }

  /**
   * Initialize all models and resources
   */
  async initialize() {
    console.log("[Upload] Initializing...");
    this.showStatus("Loading AI models...", "loading");

    try {
      // Set WASM paths
      ort.env.wasm.wasmPaths = "/js/onnx/";

      // Load all models in parallel
      const [yolo, u2net, fashionClip, labels, rules] = await Promise.all([
        this.initializeYOLO(),
        ort.InferenceSession.create("/models/u2net.onnx"),
        ort.InferenceSession.create("/models/fashionclip_image_encoder.onnx"),
        fetch("/models/label_embeddings.json").then((r) => r.json()),
        fetch("/models/weather_rules.json").then((r) => r.json()),
      ]);

      this.yoloDetector = yolo;
      this.u2netSession = u2net;
      this.fashionClipSession = fashionClip;
      this.labelEmbeddings = labels;
      this.weatherRules = rules;

      console.log("[Upload] All models loaded");
      this.showStatus("AI models loaded successfully", "success");

      setTimeout(() => this.hideStatus(), 2000);
      return true;
    } catch (error) {
      console.error("[Upload] Initialization failed:", error);
      this.showStatus("Failed to load AI models: " + error.message, "error");
      // Continue without YOLO if it fails
      this.yoloDetector = null;
      return false;
    }
  }

  /**
   * Initialize YOLO detector
   */
  async initializeYOLO() {
    try {
      const detector = new YOLODetector();
      await detector.initialize();
      return detector;
    } catch (error) {
      console.warn(
        "[YOLO] Failed to initialize, continuing without detection:",
        error
      );
      return null;
    }
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(file) {
    console.log("[Upload] Processing file:", file.name);
    this.currentImageFile = file;

    try {
      // Load image
      const image = await this.loadImage(file);
      this.currentImage = image;

      // Show original image
      document.getElementById("previewImage").src = image.src;
      document.getElementById("preview").classList.remove("hidden");

      // Get selected category
      const categorySelect = document.getElementById("clothing_piece_category");
      const selectedCategory = categorySelect ? categorySelect.value : null;

      if (this.yoloDetector && selectedCategory) {
        // Run YOLO detection
        this.showStatus("Detecting and cropping clothing...", "loading");

        try {
          this.detections = await this.yoloDetector.detect(image);

          if (this.detections.length > 0) {
            // Map form category to YOLO category
            const categoryMap = {
              tops: "top",
              bottoms: "bottom",
              outerwear: "outerwear",
              shoes: "shoes",
              accessories: "accessories",
            };
            const targetCategory = categoryMap[selectedCategory];

            // Find best matching detection for selected category
            const matchingDetection = this.detections.find(
              (det) => det.category === targetCategory
            );

            if (matchingDetection) {
              // Auto-crop to matching detection
              await this.autoCropToDetection(matchingDetection);
            } else {
              // No match - use largest detection
              console.log(
                `[Upload] No ${targetCategory} detected, using largest item`
              );
              await this.autoCropToDetection(this.detections[0]);
            }
          } else {
            // No detections - enable manual processing
            this.enableManualProcessing();
          }
        } catch (error) {
          console.error("[Upload] Detection failed:", error);
          this.enableManualProcessing();
        }
      } else {
        // No YOLO or no category selected - enable manual processing
        this.enableManualProcessing();
      }
    } catch (error) {
      console.error("[Upload] File processing failed:", error);
      this.showStatus("Failed to load image", "error");
    }
  }

  /**
   * Automatically crop to detection without user confirmation
   */
  async autoCropToDetection(detection) {
    console.log("[Upload] Auto-cropping to:", detection.category);

    // Crop to detection bbox
    const croppedCanvas = this.yoloDetector.cropToBbox(
      this.currentImage,
      detection.bbox,
      0.05 // 5% padding
    );

    // Update preview with cropped image
    document.getElementById("previewImage").src = croppedCanvas.toDataURL();

    // Enable process button
    document.getElementById("processBtn").disabled = false;

    this.showStatus(
      `Cropped to ${detection.category}. Ready to process.`,
      "success"
    );
    setTimeout(() => this.hideStatus(), 2000);
  }

  /**
   * Enable manual processing (no YOLO, no detection, or no category)
   */
  enableManualProcessing() {
    document.getElementById("processBtn").disabled = false;
    this.showStatus(
      "Ready to process. Click 'Process Image' button.",
      "success"
    );
    setTimeout(() => this.hideStatus(), 2000);
  }

  /**
   * Main processing function - integrates with your existing pipeline
   */
  /**
   * Main processing function (called by your existing processImage button)
   * This integrates with your existing pipeline
   */
  async processImage() {
    if (!this.u2netSession || !this.fashionClipSession) {
      alert("Models not loaded");
      return;
    }

    document.getElementById("processBtn").disabled = true;
    this.showStatus("Step 1/3: Removing background...", "loading");

    try {
      // Get current image (either cropped or original)
      const imgSrc = document.getElementById("previewImage").src;
      const img = await this.loadImageFromSrc(imgSrc);

      // Step 1: Background removal (your existing code)
      const cleanedImage = await this.removeBackground(img);
      document.getElementById("previewImage").src = cleanedImage;

      this.showStatus("Step 2/3: Generating embedding...", "loading");

      // Step 2: Generate embedding (your existing code)
      const embedding = await this.generateEmbedding(cleanedImage);
      this.currentImageEmbedding = embedding;
      document.getElementById("embeddingField").value =
        JSON.stringify(embedding);

      this.showStatus("Step 3/3: Auto-tagging...", "loading");

      // Step 3: Auto-tag (your existing code)
      const tags = await this.autoTag(embedding);
      this.displayTags(tags);

      this.showStatus("Processing complete!", "success");
      document.getElementById("submitBtn").disabled = false;
    } catch (error) {
      this.showStatus("Processing failed: " + error.message, "error");
      document.getElementById("processBtn").disabled = false;
    }
  }

  /**
   * Load image from file
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load image from src URL
   */
  loadImageFromSrc(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Remove background using U2-Net (your existing implementation)
   */
  async removeBackground(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 320;
    canvas.height = 320;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, 320, 320);

    const imageData = ctx.getImageData(0, 0, 320, 320);
    const tensorData = new Float32Array(3 * 320 * 320);

    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    for (let i = 0; i < 320 * 320; i++) {
      const pixelIndex = i * 4;
      tensorData[i] = (imageData.data[pixelIndex] / 255.0 - mean[0]) / std[0];
      tensorData[320 * 320 + i] =
        (imageData.data[pixelIndex + 1] / 255.0 - mean[1]) / std[1];
      tensorData[2 * 320 * 320 + i] =
        (imageData.data[pixelIndex + 2] / 255.0 - mean[2]) / std[2];
    }

    const tensor = new ort.Tensor("float32", tensorData, [1, 3, 320, 320]);
    const feeds = { "input.1": tensor };
    const outputs = await this.u2netSession.run(feeds);
    const outputName = this.u2netSession.outputNames[0];
    const mask = outputs[outputName].data;

    return this.applyMask(img, mask, 320, 320);
  }

  /**
   * Apply mask to image (your existing implementation)
   */
  applyMask(img, mask, maskWidth, maskHeight) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const maskX = Math.floor((x * maskWidth) / img.width);
        const maskY = Math.floor((y * maskHeight) / img.height);
        const maskValue = mask[maskY * maskWidth + maskX];
        const alpha = Math.floor(maskValue * 255);
        imageData.data[(y * img.width + x) * 4 + 3] = alpha;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }

  /**
   * Generate embedding using FashionCLIP (your existing implementation)
   */
  async generateEmbedding(imageSrc) {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 224;
    canvas.height = 224;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, 224, 224);

    const imageData = ctx.getImageData(0, 0, 224, 224);
    const tensorData = new Float32Array(3 * 224 * 224);

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
    const outputs = await this.fashionClipSession.run(feeds);

    const rawEmbedding = Array.from(outputs[Object.keys(outputs)[0]].data);
    const norm = Math.sqrt(
      rawEmbedding.reduce((sum, val) => sum + val * val, 0)
    );
    const normalizedEmbedding = rawEmbedding.map((val) => val / norm);

    return normalizedEmbedding;
  }

  /**
   * Auto-tag using label embeddings (your existing implementation)
   */
  async autoTag(imageEmbedding) {
    const similarities = {};
    const selectedCategory = document.getElementById(
      "clothing_piece_category"
    ).value;

    // Category-relevant label patterns (your existing logic)
    const categoryBoosts = {
      tops: [
        "shirt",
        "t-shirt",
        "blouse",
        "sweater",
        "hoodie",
        "tank",
        "cardigan",
        "polo",
        "top",
      ],
      bottoms: [
        "jeans",
        "pants",
        "shorts",
        "skirt",
        "leggings",
        "trousers",
        "joggers",
        "sweatpants",
      ],
      outerwear: [
        "jacket",
        "coat",
        "blazer",
        "parka",
        "windbreaker",
        "cardigan",
        "vest",
      ],
      shoes: [
        "shoes",
        "sneakers",
        "boots",
        "heels",
        "sandals",
        "flats",
        "loafers",
        "pumps",
      ],
      accessories: [
        "hat",
        "cap",
        "beanie",
        "scarf",
        "gloves",
        "belt",
        "tie",
        "bag",
        "backpack",
        "purse",
        "sunglasses",
        "watch",
        "umbrella",
      ],
    };

    for (const [label, textEmbed] of Object.entries(this.labelEmbeddings)) {
      if (textEmbed.length !== imageEmbedding.length) continue;

      let similarity = this.cosineSimilarity(imageEmbedding, textEmbed);

      // Apply category boost
      if (selectedCategory && categoryBoosts[selectedCategory]) {
        const isRelevant = categoryBoosts[selectedCategory].some((pattern) =>
          label.toLowerCase().includes(pattern.toLowerCase())
        );

        if (isRelevant) {
          similarity *= 1.3; // 30% boost
        }
      }

      if (!isNaN(similarity)) {
        similarities[label] = similarity;
      }
    }

    return Object.entries(similarities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, score]) => ({ label, score }));
  }

  /**
   * Cosine similarity (your existing implementation)
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return NaN;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (normA === 0 || normB === 0) return NaN;

    return dotProduct / (normA * normB);
  }

  /**
   * Display tags (your existing implementation)
   */
  displayTags(tags) {
    const container = document.getElementById("tagsContainer");
    container.innerHTML = "";

    const tagValues = tags.map((t) => t.label);
    document.getElementById("aiTagsField").value = JSON.stringify(tagValues);

    console.log("Auto-generated tags:", tags);

    tags.forEach((tag) => {
      const tagEl = document.createElement("div");
      tagEl.className = "tag";
      tagEl.innerHTML = `
        ${tag.label} (${(tag.score * 100).toFixed(0)}%)
        <span class="remove" onclick="clothingUpload.removeTag('${tag.label}')">×</span>
      `;
      container.appendChild(tagEl);
    });
  }

  /**
   * Remove tag (your existing implementation)
   */
  removeTag(label) {
    const field = document.getElementById("aiTagsField");
    const tags = JSON.parse(field.value);
    const newTags = tags.filter((t) => t !== label);
    field.value = JSON.stringify(newTags);

    const tagEls = document.querySelectorAll(".tag");
    tagEls.forEach((el) => {
      if (el.textContent.includes(label)) {
        el.remove();
      }
    });
  }

  /**
   * Show status message (your existing implementation)
   */
  showStatus(message, type) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = "status " + type;
    status.classList.remove("hidden");
  }

  /**
   * Hide status message (your existing implementation)
   */
  hideStatus() {
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.classList.add("hidden");
    }
  }
}

// Initialize on page load
let clothingUpload;
window.addEventListener("load", async () => {
  clothingUpload = new UploadClothing();
  await clothingUpload.initialize();

  // Hook into your existing image input
  const imageInput = document.getElementById("imageInput");
  if (imageInput) {
    imageInput.addEventListener("change", async (e) => {
      if (e.target.files.length > 0) {
        await clothingUpload.handleFileUpload(e.target.files[0]);
      }
    });
  }
});

// Make processImage available globally for your existing button
async function processImage() {
  if (clothingUpload) {
    await clothingUpload.processImage();
  }
}
