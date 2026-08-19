import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "../lib/api.js";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nonce = useRef(0);

  const load = useCallback(() => {
    const id = ++nonce.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (id === nonce.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (id === nonce.current) {
          setError(err instanceof ApiClientError ? err.message : "Something went wrong loading this data.");
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
