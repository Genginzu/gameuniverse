"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameFieldOverride, TrackableField } from "@/types/admin-games";

export interface UseGameSyncReturn {
  /** Overrides currently loaded from the API */
  overrides: GameFieldOverride[];
  /** Whether overrides are being loaded */
  loadingOverrides: boolean;
  /** Field currently being synced (null if none) */
  syncingField: TrackableField | "all" | null;
  /** Sync a single field from IGDB */
  syncField: (field: TrackableField) => Promise<boolean>;
  /** Sync all fields from IGDB */
  syncAll: () => Promise<boolean>;
  /** Last error message */
  error: string | null;
  /** Reload overrides from the API */
  refreshOverrides: () => Promise<void>;
}

/**
 * Hook managing IGDB sync state for a game's field overrides.
 * Loads overrides on mount and exposes sync functions.
 *
 * Requirements: 3.1, 3.3, 3.4, 3.6
 */
export function useGameSync(gameId: string | undefined): UseGameSyncReturn {
  const [overrides, setOverrides] = useState<GameFieldOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [syncingField, setSyncingField] = useState<TrackableField | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverrides = useCallback(async () => {
    if (!gameId) return;
    setLoadingOverrides(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/overrides`);
      if (!res.ok) throw new Error("Failed to load overrides");
      const json = await res.json();
      const mapped: GameFieldOverride[] = (json.overrides ?? []).map(
        (o: {
          id: string;
          game_id: string;
          field_name: string;
          modified_by: string | null;
          modified_at: string;
        }) => ({
          id: o.id,
          gameId: o.game_id,
          fieldName: o.field_name as TrackableField,
          modifiedBy: o.modified_by,
          modifiedAt: o.modified_at,
        })
      );
      setOverrides(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingOverrides(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const syncField = useCallback(
    async (field: TrackableField): Promise<boolean> => {
      if (!gameId) return false;
      setSyncingField(field);
      setError(null);
      try {
        const res = await fetch(`/api/admin/games/${gameId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Sync failed");
        }
        await fetchOverrides();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sync failed");
        return false;
      } finally {
        setSyncingField(null);
      }
    },
    [gameId, fetchOverrides]
  );

  const syncAll = useCallback(async (): Promise<boolean> => {
    if (!gameId) return false;
    setSyncingField("all");
    setError(null);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Sync failed");
      }
      await fetchOverrides();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      return false;
    } finally {
      setSyncingField(null);
    }
  }, [gameId, fetchOverrides]);

  return {
    overrides,
    loadingOverrides,
    syncingField,
    syncField,
    syncAll,
    error,
    refreshOverrides: fetchOverrides,
  };
}
