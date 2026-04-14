import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

interface SyncImportState {
  isSyncing: boolean;
  totalSynced: number;
  totalFailed: number;
  remaining: number;
  currentGame: string | null;
  lastError: string | null;
  error: string | null;
}

interface SyncResult {
  success: boolean;
  igdbId: number;
  name: string;
  error?: string;
}

interface SyncResponse {
  results: SyncResult[];
  done: boolean;
  remaining: number;
}

export function useGlobalSyncImport(onBatchSynced?: () => void) {
  const [state, setState] = useState<SyncImportState>({
    isSyncing: false,
    totalSynced: 0,
    totalFailed: 0,
    remaining: 0,
    currentGame: null,
    lastError: null,
    error: null,
  });

  const stopRef = useRef(false);

  const startSync = useCallback(async () => {
    stopRef.current = false;
    setState({
      isSyncing: true,
      totalSynced: 0,
      totalFailed: 0,
      remaining: 0,
      currentGame: null,
      lastError: null,
      error: null,
    });

    let synced = 0;
    let failed = 0;
    let batchCount = 0;

    while (!stopRef.current) {
      try {
        const res = await apiClient.post<SyncResponse>("/api/admin/global-sync/sync", {});

        if (res.done) {
          setState((prev) => ({ ...prev, isSyncing: false, currentGame: null }));
          onBatchSynced?.();
          return;
        }

        for (const r of res.results) {
          if (r.success) synced++;
          else failed++;
        }

        const lastName = res.results[res.results.length - 1]?.name ?? null;
        const lastErr = res.results.filter((r) => !r.success).pop()?.error ?? null;
        batchCount++;

        setState((prev) => ({
          ...prev,
          totalSynced: synced,
          totalFailed: failed,
          remaining: res.remaining,
          currentGame: lastName,
          lastError: lastErr ?? prev.lastError,
        }));

        if (batchCount % 20 === 0) onBatchSynced?.();
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
    onBatchSynced?.();
  }, [onBatchSynced]);

  const stopSync = useCallback(() => {
    stopRef.current = true;
  }, []);

  return { syncState: state, startSync, stopSync };
}
