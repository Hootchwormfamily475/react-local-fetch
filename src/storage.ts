import { CacheEntry } from './types';

const DB_NAME = 'react-local-fetch';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

/**
 * Promise wrapper for IndexedDB.
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves data to IndexedDB.
 */
export async function saveToStorage<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry, `rlf_${key}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves data from IndexedDB.
 */
export async function getFromStorage<T>(key: string): Promise<CacheEntry<T> | undefined> {
  if (typeof window === 'undefined') return undefined;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(`rlf_${key}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes a specific key from IndexedDB.
 */
export async function removeFromStorage(key: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(`rlf_${key}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clears all react-local-fetch data from IndexedDB.
 */
export async function clearAllStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
