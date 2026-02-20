// IndexedDB for large media files storage
// Uses IndexedDB instead of localStorage for images/videos to avoid quota limits

const DB_NAME = "JJAcademyDB";
const DB_VERSION = 1;
const MEDIA_STORE = "mediaFiles";

interface StoredMediaFile {
  id: string;
  mediaId: string;
  albumId: string;
  type: "image" | "video";
  blob: Blob;
  title: string;
  description: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

/**
 * Initialize IndexedDB database
 */
export const initializeIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;

      // Create object store for media files
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        const store = db.createObjectStore(MEDIA_STORE, { keyPath: "id" });
        store.createIndex("mediaId", "mediaId", { unique: true });
        store.createIndex("albumId", "albumId", { unique: false });
      }
    };
  });
};

/**
 * Get IndexedDB database instance
 */
const getDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Store media file in IndexedDB
 */
export const storeMediaBlobInIndexedDB = async (
  mediaId: string,
  albumId: string,
  type: "image" | "video",
  blob: Blob,
  title: string,
  description: string,
  mimeType: string
): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([MEDIA_STORE], "readwrite");
    const store = transaction.objectStore(MEDIA_STORE);

    const storageFile: StoredMediaFile = {
      id: `${albumId}_${mediaId}`,
      mediaId,
      albumId,
      type,
      blob,
      title,
      description,
      size: blob.size,
      mimeType,
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(storageFile);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    throw new Error(`Failed to store media in IndexedDB: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Retrieve media blob from IndexedDB
 */
export const getMediaBlobFromIndexedDB = async (mediaId: string): Promise<Blob | null> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([MEDIA_STORE], "readonly");
    const store = transaction.objectStore(MEDIA_STORE);
    const index = store.index("mediaId");

    return new Promise((resolve, reject) => {
      const request = index.get(mediaId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
    });
  } catch (error) {
    console.error("Failed to retrieve media from IndexedDB:", error);
    return null;
  }
};

/**
 * Get blob URL for IndexedDB stored media
 */
export const getMediaBlobUrl = async (mediaId: string): Promise<string | null> => {
  const blob = await getMediaBlobFromIndexedDB(mediaId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
};

/**
 * Delete media file from IndexedDB
 */
export const deleteMediaFromIndexedDB = async (mediaId: string): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([MEDIA_STORE], "readwrite");
    const store = transaction.objectStore(MEDIA_STORE);
    const index = store.index("mediaId");

    return new Promise((resolve, reject) => {
      const getRequest = index.get(mediaId);

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          const deleteRequest = store.delete(result.id);
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    throw new Error(`Failed to delete media from IndexedDB: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Delete all media files for an album
 */
export const deleteAlbumMediaFromIndexedDB = async (albumId: string): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([MEDIA_STORE], "readwrite");
    const store = transaction.objectStore(MEDIA_STORE);
    const index = store.index("albumId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(albumId);

      request.onsuccess = () => {
        const results = request.result;
        let deleted = 0;

        if (results.length === 0) {
          resolve();
          return;
        }

        results.forEach((file) => {
          const deleteRequest = store.delete(file.id);
          deleteRequest.onsuccess = () => {
            deleted++;
            if (deleted === results.length) {
              resolve();
            }
          };
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw new Error(`Failed to delete album media from IndexedDB: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Get IndexedDB storage usage
 */
export const getIndexedDBUsage = async (): Promise<{ usage: number; quota: number }> => {
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 0, quota: 0 };
    }

    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  } catch {
    return { usage: 0, quota: 0 };
  }
};

/**
 * Clear all media from IndexedDB
 */
export const clearIndexedDB = async (): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([MEDIA_STORE], "readwrite");
    const store = transaction.objectStore(MEDIA_STORE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    throw new Error(`Failed to clear IndexedDB: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
