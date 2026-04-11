import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

interface SyncImportState {
  isSyncing: boolean;
  totalSynced: number;
  totalFailed: number;
  remaining: number;
  currentGame: string | null;
  error: string | null;
}

interface SyncResponse {
  success: boolean;
  done?: boolean;
  igdbId?: number;
  name?: string;
  remaining?: number;
  error?: string;
}

export function useGlobalSyncImport() {
  const [state, setState] = useState<SyncImportState>({
    isSyncing: false,
    totalSynced: 0,
    totalFailed: 0,
    remaining: 0,
    currentGame: null,
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
      error: null,
    });

    let synced = 0;
    let failed = 0;

    while (!stopRef.current) {
      try {
        const result = await apiClient.post<SyncResponse>("/api/admin/global-sync/sync", {});

        if (result.done) {
          setState((prev) => ({ ...prev, isSyncing: false, currentGame: null }));
          return;
        }

        if (result.success) {
          synced++;
        } else {
          failed++;
        }

        setState((prev) => ({
          ...prev,
          totalSynced: synced,
          totalFailed: failed,
          remaining: result.remaining ?? 0,
          currentGame: result.name ?? null,
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
  }, []);

  const stopSync = useCallback(() => {
    stopRef.current = true;
  }, []);

  return { syncState: state, startSync, stopSync };
}
