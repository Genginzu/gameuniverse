import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

interface MetascoreState {
  isSyncing: boolean;
  totalSynced: number;
  totalFailed: number;
  remaining: number;
  currentGame: string | null;
  lastSource: string | null;
  error: string | null;
}

interface MetascoreResponse {
  success?: boolean;
  done?: boolean;
  igdbId?: number;
  name?: string;
  score?: number | null;
  source?: string;
  remaining?: number;
  error?: string;
}

export function useGlobalMetascoreSync() {
  const [state, setState] = useState<MetascoreState>({
    isSyncing: false,
    totalSynced: 0,
    totalFailed: 0,
    remaining: 0,
    currentGame: null,
    lastSource: null,
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
      lastSource: null,
      error: null,
    });

    let synced = 0;
    let failed = 0;

    while (!stopRef.current) {
      try {
        const res = await apiClient.post<MetascoreResponse>("/api/admin/global-sync/metascore", {});

        if (res.done) {
          setState((prev) => ({ ...prev, isSyncing: false, currentGame: null }));
          return;
        }

        if (res.success) synced++;
        else failed++;

        setState((prev) => ({
          ...prev,
          totalSynced: synced,
          totalFailed: failed,
          remaining: res.remaining ?? 0,
          currentGame: res.name ?? null,
          lastSource: res.source ?? null,
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

  return { metascoreState: state, startMetascoreSync: startSync, stopMetascoreSync: stopSync };
}
