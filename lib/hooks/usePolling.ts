"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStoreVersion, subscribe } from "@/lib/demo-db";

type Polling<T> = {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => Promise<void>;
};

export function usePolling<T>(key: string | null, fetcher: () => Promise<T>, options?: { intervalMs?: number }): Polling<T> {
  const intervalMs = options?.intervalMs ?? 8000;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(Boolean(key));
  const [isValidating, setIsValidating] = useState(false);

  const mutate = useCallback(async () => {
    if (!key) return;
    setIsValidating(true);
    try {
      const next = await fetcherRef.current();
      setData(next);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Request failed."));
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setIsLoading(data === undefined);
    void (async () => {
      setIsValidating(true);
      try {
        const next = await fetcherRef.current();
        if (!cancelled) {
          setData(next);
          setError(undefined);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Request failed."));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsValidating(false);
        }
      }
    })();
    const timer = window.setInterval(() => void mutate(), intervalMs);
    const unsub = subscribe(() => void mutate());
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      unsub();
    };
    // getStoreVersion is read by subscribers; include key only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs]);

  void getStoreVersion;
  return { data, error, isLoading, isValidating, mutate };
}
