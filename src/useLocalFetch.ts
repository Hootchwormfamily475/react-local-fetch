import { useState, useEffect, useCallback } from 'react';
import { LocalFetchOptions, UseLocalFetchResult } from './types';
import { localFetch } from './fetcher';

/**
 * React hook for resilient, encrypted, local-first fetching.
 */
export function useLocalFetch<T>(
  url: string,
  options: LocalFetchOptions
): UseLocalFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (!isManual) setIsLoading(true);
    setError(null);

    try {
      const result = await localFetch<T>(url, options);
      setData(result);
      setIsStale(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [url, JSON.stringify(options)]); // Using stringify to detect option changes

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    revalidate,
    isStale,
  };
}
