import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

export interface BatchSyncState {
  isSyncing: boolean;
  totalSynced: number;
  totalFailed: number;
  remaining: number;
  currentGame: string | null;
  error: string | null;
}

interface BatchSyncResponse {
  results: Array<{ success: boolean; igdbId: number; name: string; error?: string }>;
  done: boolean;
  remaining: number;
}

const INITIAL_STATE: BatchSyncState = {
  isSyncing: false,
  totalSynced: 0,
  totalFailed: 0,
  remaining: 0,
  currentGame: null,
  error: null,
};

/**
 * Generic hook for batch sync tabs.
 * Each tab just provides its API endpoint.
 */
export function useBatchSync(endpoint: string) {
  const [state, setState] = useState<BatchSyncState>(INITIAL_STATE);
  const stopRef = useRef(false);

  const start = useCallback(async () => {
    stopRef.current = false;
    setState({ ...INITIAL_STATE, isSyncing: true });

    let synced = 0;
    let failed = 0;

    while (!stopRef.current) {
      try {
        const res = await apiClient.post<BatchSyncResponse>(endpoint, {});

        if (res.done) {
          setState((prev) => ({ ...prev, isSyncing: false, currentGame: null }));
          return;
        }

        for (const r of res.results) {
          if (r.success) synced++;
          else failed++;
        }

        const lastName = res.results[res.results.length - 1]?.name ?? null;

        setState((prev) => ({
          ...prev,
          totalSynced: synced,
          totalFailed: failed,
          remaining: res.remaining,
          currentGame: lastName,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: err instanceof Error ? err.message : "Sync failed",
        }));
        return;
      }
    }

    setState((prev) => ({ ...prev, isSyncing: false }));
  }, [endpoint]);

  const stop = useCallback(() => {
    stopRef.current = true;
  }, []);

  return { syncState: state, start, stop };
}
