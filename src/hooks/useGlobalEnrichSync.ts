import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

interface EnrichState {
  isSyncing: boolean;
  totalSynced: number;
  totalFailed: number;
  remaining: number;
  currentGame: string | null;
  error: string | null;
}

interface EnrichResult {
  success: boolean;
  igdbId: number;
  name: string;
}

interface EnrichResponse {
  results: EnrichResult[];
  done: boolean;
  remaining: number;
}

export function useGlobalEnrichSync() {
  const [state, setState] = useState<EnrichState>({
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
        const res = await apiClient.post<EnrichResponse>("/api/admin/global-sync/enrich", {});

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
  }, []);

  const stopSync = useCallback(() => {
    stopRef.current = true;
  }, []);

  return { enrichState: state, startEnrich: startSync, stopEnrich: stopSync };
}
