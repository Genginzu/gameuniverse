"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrackableField } from "@/types/admin-games";

export interface UseGameOverridesReturn {
  /** Returns true if the field still has the original IGDB data (no override) */
  isIgdbField: (fieldName: TrackableField) => boolean;
  /** Whether overrides are being loaded */
  loading: boolean;
  /** Re-fetch overrides from the API (e.g. after saving the game) */
  refetchOverrides: () => Promise<void>;
}

/** Always returns false — used when the game has no igdb_id */
const ALWAYS_FALSE = () => false;

/**
 * Hook that loads field overrides for a game and exposes a function
 * to check whether a field still contains original IGDB data.
 *
 * If the game has no igdb_id, isIgdbField always returns false
 * (no indicator should be shown).
 *
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
export function useGameOverrides(
  gameId: string | undefined,
  igdbId: number | null | undefined
): UseGameOverridesReturn {
  const [overriddenFields, setOverriddenFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const hasIgdb = !!igdbId;

  const fetchOverrides = useCallback(async () => {
    if (!gameId || !hasIgdb) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/overrides`);
      if (!res.ok) throw new Error("Failed to load overrides");
      const json = await res.json();
      const fieldNames = new Set<string>(
        (json.overrides ?? []).map((o: { field_name: string }) => o.field_name)
      );
      setOverriddenFields(fieldNames);
    } catch {
      // On error, assume no overrides — indicators won't show
      setOverriddenFields(new Set());
    } finally {
      setLoading(false);
    }
  }, [gameId, hasIgdb]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const isIgdbField = useCallback(
    (fieldName: TrackableField): boolean => {
      if (!hasIgdb) return false;
      return !overriddenFields.has(fieldName);
    },
    [hasIgdb, overriddenFields]
  );

  // No igdb_id → always false, no indicators
  if (!hasIgdb) {
    return { isIgdbField: ALWAYS_FALSE, loading: false, refetchOverrides: async () => {} };
  }

  return { isIgdbField, loading, refetchOverrides: fetchOverrides };
}
