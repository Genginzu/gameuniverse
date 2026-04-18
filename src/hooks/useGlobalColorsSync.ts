import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

interface ColorsState {
  isSyncing: boolean;
  totalSynced: number;
  totalFailed: number;
  remaining: number;
  currentGame: string | null;
  error: string | null;
}

interface ColorsResponse {
  results?: Array<{ success: boolean; igdbId: number; name: string }>;
  done?: boolean;
  remaining?: number;
}

export function useGlobalColorsSync(onGameSynced?: () => void) {
  const [state, setState] = useState<ColorsState>({
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
    let batchCount = 0;

    while (!stopRef.current) {
      try {
        const res = await apiClient.post<ColorsResponse>("/api/admin/global-sync/colors", {});

        if (res.done) {
          setState((prev) => ({ ...prev, isSyncing: false, currentGame: null }));
          onGameSynced?.();
          return;
        }

        for (const r of res.results ?? []) {
          if (r.success) synced++;
          else failed++;
        }

        const lastName = res.results?.[res.results.length - 1]?.name ?? null;
        batchCount++;

        setState((prev) => ({
          ...prev,
          totalSynced: synced,
          totalFailed: failed,
          remaining: res.remaining ?? 0,
          currentGame: lastName,
        }));

        if (batchCount % 10 === 0) onGameSynced?.();
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
    onGameSynced?.();
  }, [onGameSynced]);

  const stopSync = useCallback(() => {
    stopRef.current = true;
  }, []);

  return { colorsState: state, startColors: startSync, stopColors: stopSync };
}
