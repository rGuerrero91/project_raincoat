// Browser-based image cache using IndexedDB
// Stores processed images locally for persistence across page reloads

const DB_NAME = 'raincoat-image-cache';
const DB_VERSION = 1;
const STORE_NAME = 'processed-images';

interface CachedImage {
  itemId: number;
  imageBlob: Blob;
  timestamp: number;
}

class ImageCache {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB database
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'itemId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a processed image to cache
   * @param itemId - The clothing item ID
   * @param imageSource - The blob URL, data URL, or Blob of the processed image
   */
  async saveImage(itemId: number, imageSource: string | Blob): Promise<void> {
    try {
      const db = await this.getDB();

      // Convert to Blob for storage
      let blob: Blob;

      if (imageSource instanceof Blob) {
        // Already a Blob, use directly
        blob = imageSource;
      } else if (typeof imageSource === 'string') {
        if (imageSource.startsWith('blob:')) {
          try {
            const response = await fetch(imageSource);
            if (!response.ok) {
              console.warn(`[ImageCache] Failed to fetch blob URL (status: ${response.status})`);
              return;
            }
            blob = await response.blob();
          } catch (fetchError) {
            // Blob URL might have been revoked or is inaccessible
            console.warn('[ImageCache] Blob URL is no longer accessible (may have been revoked):', fetchError);
            return;
          }
        } else if (imageSource.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(imageSource);
          blob = await response.blob();
        } else {
          console.warn('[ImageCache] Invalid image URL format:', imageSource.substring(0, 50));
          return;
        }
      } else {
        console.warn('[ImageCache] Invalid image source type:', typeof imageSource);
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const cachedImage: CachedImage = {
        itemId,
        imageBlob: blob,
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedImage);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`[ImageCache] Saved processed image for item ${itemId} (${(blob.size / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error('[ImageCache] Failed to save image:', error);
    }
  }

  /**
   * Get a processed image from cache
   * @param itemId - The clothing item ID
   * @returns Blob URL of the cached image, or null if not found
   */
  async getImage(itemId: number): Promise<string | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const cachedImage = await new Promise<CachedImage | null>((resolve, reject) => {
        const request = store.get(itemId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (!cachedImage) {
        console.log(`[ImageCache] No cached image found for item ${itemId}`);
        return null;
      }

      // Convert Blob to URL
      const blobUrl = URL.createObjectURL(cachedImage.imageBlob);
      console.log(`[ImageCache] Retrieved cached image for item ${itemId}`);
      return blobUrl;
    } catch (error) {
      console.error('[ImageCache] Failed to get image:', error);
      return null;
    }
  }

  /**
   * Check if a processed image exists in cache
   * @param itemId - The clothing item ID
   */
  async hasImage(itemId: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise<boolean>((resolve, reject) => {
        const request = store.get(itemId);
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[ImageCache] Failed to check image:', error);
      return false;
    }
  }

  /**
   * Delete a processed image from cache
   * @param itemId - The clothing item ID
   */
  async deleteImage(itemId: number): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(itemId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`[ImageCache] Deleted cached image for item ${itemId}`);
    } catch (error) {
      console.error('[ImageCache] Failed to delete image:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('[ImageCache] Cleared all cached images');
    } catch (error) {
      console.error('[ImageCache] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const allImages = await new Promise<CachedImage[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      const totalSize = allImages.reduce((sum, img) => sum + img.imageBlob.size, 0);

      return {
        count: allImages.length,
        totalSize,
      };
    } catch (error) {
      console.error('[ImageCache] Failed to get stats:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache();
export default imageCache;
