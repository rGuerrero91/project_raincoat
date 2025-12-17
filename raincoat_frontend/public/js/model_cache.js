/**
 * Model Cache Manager
 * Uses IndexedDB to cache ONNX models and JSON data
 */

class ModelCache {
  constructor() {
    this.dbName = "RaincoatModelCache";
    this.dbVersion = 1;
    this.db = null;
  }

  async initialize() {
    // Check storage quota before initializing
    await this.checkStorageQuota();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for models
        if (!db.objectStoreNames.contains("models")) {
          db.createObjectStore("models", { keyPath: "url" });
        }

        // Create store for JSON data
        if (!db.objectStoreNames.contains("json")) {
          db.createObjectStore("json", { keyPath: "url" });
        }
      };
    });
  }

  /**
   * Check storage quota availability
   * Throws error if insufficient storage for models
   */
  async checkStorageQuota() {
    if (!navigator.storage || !navigator.storage.estimate) {
      console.warn("[Cache] Storage API not available - quota check skipped");
      return { available: true, quotaMB: 0, usageMB: 0, availableMB: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quotaMB = (estimate.quota || 0) / (1024 * 1024);
      const usageMB = (estimate.usage || 0) / (1024 * 1024);
      const availableMB = quotaMB - usageMB;

      // All models require ~170MB total
      const requiredMB = 185; // Add buffer for overhead

      console.log(
        `[Cache] Storage: ${availableMB.toFixed(0)}MB available of ${quotaMB.toFixed(0)}MB total (using ${usageMB.toFixed(0)}MB, need ${requiredMB}MB)`
      );

      if (availableMB < requiredMB) {
        const error = new Error(
          `Insufficient storage space for AI models.\n\n` +
            `Required: ~${requiredMB}MB\n` +
            `Available: ${availableMB.toFixed(0)}MB\n\n` +
            `Please free up space by:\n` +
            `- Clearing browser cache and data\n` +
            `- Removing unused files/apps\n` +
            `- Checking storage in Settings`
        );
        error.name = "QuotaExceededError";
        throw error;
      }

      return { available: true, quotaMB, usageMB, availableMB };
    } catch (err) {
      if (err.name === "QuotaExceededError") {
        throw err; // Re-throw quota errors
      }
      console.warn("[Cache] Failed to check storage quota:", err);
      return { available: false, quotaMB: 0, usageMB: 0, availableMB: 0 };
    }
  }

  async getModel(url) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["models"], "readonly");
      const store = transaction.objectStore("models");
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result) {
          // Check if cached model is older than 7 days
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          const age = Date.now() - request.result.timestamp;

          if (age > SEVEN_DAYS_MS) {
            console.log(`[Cache] Model cache expired (${Math.floor(age / (24 * 60 * 60 * 1000))} days old): ${url}`);
            resolve(null); // Return null to trigger fresh fetch
          } else {
            console.log(`[Cache] Model loaded from cache: ${url}`);
            resolve(request.result.data);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async setModel(url, data) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["models"], "readwrite");
      const store = transaction.objectStore("models");
      const request = store.put({
        url: url,
        data: data,
        timestamp: Date.now(),
      });

      request.onsuccess = () => {
        console.log(`[Cache] Model stored in cache: ${url}`);
        resolve();
      };

      request.onerror = (event) => {
        const error = event.target.error;

        // Handle quota exceeded errors with user-friendly message
        if (error.name === "QuotaExceededError") {
          const friendlyError = new Error(
            `Storage quota exceeded while caching model.\n\n` +
              `The browser ran out of storage space while saving this AI model.\n\n` +
              `Solutions:\n` +
              `- Clear browser cache and site data\n` +
              `- Free up device storage\n` +
              `- Use a different browser with more available quota\n\n` +
              `Note: The demo will still work but models won't be cached for offline use.`
          );
          friendlyError.name = "QuotaExceededError";
          console.error("[Cache] Quota exceeded:", friendlyError.message);
          reject(friendlyError);
        } else {
          reject(error);
        }
      };
    });
  }

  async getJSON(url) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["json"], "readonly");
      const store = transaction.objectStore("json");
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result) {
          // Check if cached JSON is older than 7 days
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          const age = Date.now() - request.result.timestamp;

          if (age > SEVEN_DAYS_MS) {
            console.log(`[Cache] JSON cache expired (${Math.floor(age / (24 * 60 * 60 * 1000))} days old): ${url}`);
            resolve(null); // Return null to trigger fresh fetch
          } else {
            console.log(`[Cache] JSON loaded from cache: ${url}`);
            resolve(request.result.data);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async setJSON(url, data) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["json"], "readwrite");
      const store = transaction.objectStore("json");
      const request = store.put({
        url: url,
        data: data,
        timestamp: Date.now(),
      });

      request.onsuccess = () => {
        console.log(`[Cache] JSON stored in cache: ${url}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async loadONNXModel(url) {
    // check cache first
    const cachedData = await this.getModel(url);
    if (cachedData) {
      // Return raw ArrayBuffer - caller will create session
      return cachedData;
    }

    // if not there fetch and store
    console.log(`[Cache] Fetching model from server: ${url}`);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Try to store in cache, but don't fail if quota exceeded
    try {
      await this.setModel(url, arrayBuffer);
    } catch (err) {
      if (err.name === "QuotaExceededError") {
        console.warn(
          `[Cache] Could not cache model due to quota limits - will fetch on each use`
        );
        console.warn(`[Cache] ${err.message}`);
        // Continue without caching - model is still loaded in memory
      } else {
        // For other errors, log but continue
        console.error(`[Cache] Failed to cache model:`, err);
      }
    }

    // Return raw ArrayBuffer - caller will create session
    return arrayBuffer;
  }

  async loadJSON(url) {
    // Check cache first
    const cachedData = await this.getJSON(url);
    if (cachedData) {
      return cachedData;
    }

    // not in cache  fetch and store
    console.log(`[Cache] Fetching JSON from server: ${url}`);
    const response = await fetch(url);
    const data = await response.json();

    // Store
    await this.setJSON(url, data);

    return data;
  }

  //*** Clear all cached models
  async clearCache() {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["models", "json"], "readwrite");

      transaction.objectStore("models").clear();
      transaction.objectStore("json").clear();

      transaction.oncomplete = () => {
        console.log("[Cache] Cache cleared");
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  //* Get cache statistics
  async getStats() {
    if (!this.db) await this.initialize();

    const modelCount = await this._getCount("models");
    const jsonCount = await this._getCount("json");

    // Get storage quota info
    let storageInfo = { quotaMB: 0, usageMB: 0, availableMB: 0 };
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        storageInfo.quotaMB = (estimate.quota || 0) / (1024 * 1024);
        storageInfo.usageMB = (estimate.usage || 0) / (1024 * 1024);
        storageInfo.availableMB = storageInfo.quotaMB - storageInfo.usageMB;
      } catch (e) {
        console.warn("[Cache] Failed to get storage estimate:", e);
      }
    }

    return {
      models: modelCount,
      json: jsonCount,
      total: modelCount + jsonCount,
      storage: storageInfo,
    };
  }

  async _getCount(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create global instance
window.modelCache = new ModelCache();
