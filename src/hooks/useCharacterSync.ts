"use client";

import { useCallback, useEffect, useState } from "react";
import type { CharacterFieldOverride, CharacterTrackableField } from "@/types/admin-characters";

export interface UseCharacterSyncReturn {
  /** Overrides currently loaded from the API */
  overrides: CharacterFieldOverride[];
  /** Whether overrides are being loaded */
  loadingOverrides: boolean;
  /** Field currently being synced (null if none) */
  syncingField: CharacterTrackableField | "all" | null;
  /** Sync a single field from IGDB */
  syncField: (field: CharacterTrackableField) => Promise<boolean>;
  /** Sync all fields from IGDB */
  syncAll: () => Promise<boolean>;
  /** Last error message */
  error: string | null;
  /** Reload overrides from the API */
  refreshOverrides: () => Promise<void>;
}

/**
 * Hook managing IGDB sync state for a character's field overrides.
 * Loads overrides on mount and exposes sync functions.
 * Modeled on useGameSync.ts.
 */
export function useCharacterSync(characterId: string | undefined): UseCharacterSyncReturn {
  const [overrides, setOverrides] = useState<CharacterFieldOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [syncingField, setSyncingField] = useState<CharacterTrackableField | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverrides = useCallback(async () => {
    if (!characterId) return;
    setLoadingOverrides(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/characters/${characterId}/overrides`);
      if (!res.ok) throw new Error("Failed to load overrides");
      const json = await res.json();
      const mapped: CharacterFieldOverride[] = (json.overrides ?? []).map(
        (o: {
          id: string;
          character_id: string;
          field_name: string;
          overridden_by: string | null;
          overridden_at: string;
        }) => ({
          id: o.id,
          characterId: o.character_id,
          fieldName: o.field_name as CharacterTrackableField,
          overriddenBy: o.overridden_by,
          overriddenAt: o.overridden_at,
        })
      );
      setOverrides(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingOverrides(false);
    }
  }, [characterId]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const syncField = useCallback(
    async (field: CharacterTrackableField): Promise<boolean> => {
      if (!characterId) return false;
      setSyncingField(field);
      setError(null);
      try {
        const res = await fetch(`/api/admin/characters/${characterId}/sync`, {
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
    [characterId, fetchOverrides]
  );

  const syncAll = useCallback(async (): Promise<boolean> => {
    if (!characterId) return false;
    setSyncingField("all");
    setError(null);
    try {
      const res = await fetch(`/api/admin/characters/${characterId}/sync`, {
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
  }, [characterId, fetchOverrides]);

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
