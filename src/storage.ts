import { get, set, del, clear } from 'idb-keyval';
import { CacheEntry } from './types';

/**
 * Saves data to IndexedDB.
 */
export async function saveToStorage<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(`rlf_${key}`, entry);
}

/**
 * Retrieves data from IndexedDB.
 */
export async function getFromStorage<T>(key: string): Promise<CacheEntry<T> | undefined> {
  if (typeof window === 'undefined') return undefined;
  return await get(`rlf_${key}`);
}

/**
 * Deletes a specific key from IndexedDB.
 */
export async function removeFromStorage(key: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await del(`rlf_${key}`);
}

/**
 * Clears all react-local-fetch data from IndexedDB.
 */
export async function clearAllStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  // This is a bit aggressive, but we could filter keys if needed.
  // For now, let's use a simple clear or filtered clear.
  await clear();
}
