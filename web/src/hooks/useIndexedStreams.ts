"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchIndexedStreams,
  type IndexedStream,
} from "@/lib/backend";

export function useIndexedStreams(
  companyId?: string,
  employee?: string,
) {
  const [streams, setStreams] = useState<IndexedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchIndexedStreams({
        companyId,
        employee,
      });;

      setStreams(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load streams",
      );
    } finally {
      setLoading(false);
    }
 }, [companyId, employee]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    streams,
    loading,
    error,
    refresh,
  };
}
