import { LocalFetchOptions, CacheEntry, CacheMetadata } from './types';
import { getFromStorage, saveToStorage } from './storage';
import { encrypt, decrypt } from './crypto';

const isServer = typeof window === 'undefined';

/**
 * The core fetching engine for react-local-fetch.
 */
export async function localFetch<T>(
  url: string,
  options: LocalFetchOptions
): Promise<T> {
  const {
    key,
    version = 0,
    ttl = 0,
    encrypt: shouldEncrypt = false,
    secret,
    headers = {},
    fallbackToCache = true,
  } = options;

  if (isServer) {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  // 1. Try to get from cache
  const cached = await getFromStorage<T>(key);

  if (cached) {
    const { metadata, data: storedData } = cached;

    // Check version
    const isVersionValid = metadata.version >= version;

    // Check TTL
    const isTTLExpired = ttl > 0 && Date.now() - metadata.timestamp > ttl * 1000;

    if (isVersionValid && !isTTLExpired) {
      // Return cached data (decrypt if necessary)
      try {
        let finalData: string;
        if (metadata.isEncrypted) {
          if (!secret) throw new Error('Secret is required to decrypt data.');
          finalData = await decrypt(
            storedData,
            secret,
            metadata.salt!,
            metadata.iv!
          );
        } else {
          finalData = typeof storedData === 'string' ? storedData : JSON.stringify(storedData);
        }
        
        // Trigger background sync (revalidate)
        // We don't await this so it returns instantly
        revalidateBackground(url, options);

        return JSON.parse(finalData);
      } catch (err) {
        console.warn('Failed to decrypt or parse cache. Fetching fresh data...', err);
      }
    } else if (isVersionValid && isTTLExpired && fallbackToCache) {
       // Stale data but fallback allowed
       revalidateBackground(url, options);
       
       try {
         let finalData: string;
         if (metadata.isEncrypted) {
           if (!secret) throw new Error('Secret is required to decrypt data.');
           finalData = await decrypt(storedData, secret, metadata.salt!, metadata.iv!);
         } else {
           finalData = typeof storedData === 'string' ? storedData : JSON.stringify(storedData);
         }
         return JSON.parse(finalData);
       } catch (err) {
         // Silently fail and continue to fresh fetch
       }
    }
  }

  // 2. Fetch fresh data
  return await fetchAndStore(url, options);
}

/**
 * Fetches data from network, encrypts it (if needed), and stores it.
 */
async function fetchAndStore<T>(url: string, options: LocalFetchOptions): Promise<T> {
  const { key, version = 0, encrypt: shouldEncrypt = false, secret, headers = {} } = options;
  
  const response = await fetch(url, { headers });
  if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
  }
  const freshData = await response.json();
  const jsonString = JSON.stringify(freshData);

  const metadata: CacheMetadata = {
    timestamp: Date.now(),
    version,
    isEncrypted: shouldEncrypt,
  };

  let dataToStore: any;

  if (shouldEncrypt) {
    if (!secret) throw new Error('Secret is required to encrypt data.');
    const { buffer, salt, iv } = await encrypt(jsonString, secret);
    dataToStore = buffer;
    metadata.salt = salt;
    metadata.iv = iv;
  } else {
    dataToStore = freshData;
  }

  const entry: CacheEntry<T> = {
    data: dataToStore,
    metadata,
  };

  await saveToStorage(key, entry);

  return freshData;
}

/**
 * Background revalidation to update the cache without blocking.
 */
async function revalidateBackground(url: string, options: LocalFetchOptions): Promise<void> {
  try {
    await fetchAndStore(url, options);
  } catch (err) {
    console.warn(`Background sync failed for ${url}`, err);
  }
}
