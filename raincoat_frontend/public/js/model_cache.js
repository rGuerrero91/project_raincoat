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

  async getModel(url) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["models"], "readonly");
      const store = transaction.objectStore("models");
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`[Cache] Model loaded from cache: ${url}`);
          resolve(request.result.data);
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

      request.onerror = () => reject(request.error);
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
          console.log(`[Cache] JSON loaded from cache: ${url}`);
          resolve(request.result.data);
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
      return await ort.InferenceSession.create(cachedData);
    }

    // if not there fetch and store
    console.log(`[Cache] Fetching model from server: ${url}`);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Store in cache
    await this.setModel(url, arrayBuffer);

    // session
    return await ort.InferenceSession.create(arrayBuffer);
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

    return {
      models: modelCount,
      json: jsonCount,
      total: modelCount + jsonCount,
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
