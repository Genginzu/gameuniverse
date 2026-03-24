"use client";

import { useCallback, useEffect, useState } from "react";
import type { CharacterTrackableField } from "@/types/admin-characters";

export interface UseCharacterOverridesReturn {
  /** Returns true if the field still has the original IGDB data (no override) */
  isIgdbField: (fieldName: CharacterTrackableField) => boolean;
  /** Whether overrides are being loaded */
  loading: boolean;
  /** Re-fetch overrides from the API (e.g. after saving the character) */
  refetchOverrides: () => Promise<void>;
}

/** Always returns false — used when the character has no igdb_id */
const ALWAYS_FALSE = () => false;

/**
 * Hook that loads field overrides for a character and exposes a function
 * to check whether a field still contains original IGDB data.
 *
 * If the character has no igdb_id, isIgdbField always returns false
 * (no indicator should be shown).
 *
 * Modeled on useGameOverrides.ts.
 */
export function useCharacterOverrides(
  characterId: string | undefined,
  igdbId: number | null | undefined
): UseCharacterOverridesReturn {
  const [overriddenFields, setOverriddenFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const hasIgdb = !!igdbId;

  const fetchOverrides = useCallback(async () => {
    if (!characterId || !hasIgdb) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/characters/${characterId}/overrides`);
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
  }, [characterId, hasIgdb]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const isIgdbField = useCallback(
    (fieldName: CharacterTrackableField): boolean => {
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
