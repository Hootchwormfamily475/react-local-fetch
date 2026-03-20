import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { saveToStorage, getFromStorage } from './storage';

describe('storage advanced error handling', () => {
  const testKey = 'error-test';
  const testEntry = {
    data: { msg: 'test' },
    metadata: { timestamp: Date.now(), version: 1, isEncrypted: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle IndexedDB open errors gracefully', async () => {
    // Mock indexedDB.open to fail
    const originalOpen = indexedDB.open;
    indexedDB.open = vi.fn().mockImplementation(() => {
      const request = {
        onerror: null as any,
        onsuccess: null as any,
        result: null,
        error: new Error('Failed to open database'),
      };
      setTimeout(() => {
        if (request.onerror) request.onerror();
      }, 0);
      return request;
    });

    // In storage.ts, getDB() rejects on onerror
    await expect(saveToStorage(testKey, testEntry)).rejects.toThrow('Failed to open database');

    // Restore
    indexedDB.open = originalOpen;
  });

  it('should handle transaction errors gracefully', async () => {
    // 1. Open the DB normally first
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('react-local-fetch', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const originalTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = vi.fn().mockImplementation(() => {
      throw new Error('Transaction failed');
    });

    await expect(getFromStorage(testKey)).rejects.toThrow('Transaction failed');

    // Restore
    IDBDatabase.prototype.transaction = originalTransaction;
    db.close();
  });
});
