"use client";

/**
 * useEditorialRailState : gère l'état "quel space a sa sub-sidebar ouverte"
 * pour le rail éditorial, avec persistance localStorage.
 *
 * - Hydratation différée : le state initial côté server est toujours `null`
 *   (sub-sidebar fermée), puis on lit `localStorage` côté client après le
 *   mount. Évite les mismatches d'hydratation Next.js.
 * - Auto-correction : si `localStorage` contient une valeur invalide
 *   (manipulation manuelle, version antérieure), on retombe sur `null`.
 * - Tolère les erreurs de quota / mode privé sans planter.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useCallback, useEffect, useState } from "react";

import {
  EDITORIAL_SPACES,
  type EditorialSpaceKey,
} from "@/components/layout/editorial/EditorialRail";

const STORAGE_KEY = "gu.editorial.openSpace.v1";

const VALID_SPACE_KEYS: ReadonlySet<EditorialSpaceKey> = new Set(
  EDITORIAL_SPACES.map((s) => s.key)
);

interface UseEditorialRailStateResult {
  /** Space dont la sub-sidebar est ouverte. `null` = fermée. */
  openSpace: EditorialSpaceKey | null;
  /**
   * Toggle pour le clic sur une icône du rail :
   *   - cliquer sur le space déjà ouvert → ferme
   *   - cliquer sur un autre space → bascule sur celui-ci
   *   - cliquer alors que tout est fermé → ouvre ce space
   */
  toggleSpace: (key: EditorialSpaceKey) => void;
  /** Force la fermeture (clic sur ╳, Escape, clic en dehors). */
  closeSpace: () => void;
  /** Force l'ouverture d'un space spécifique (utile pour les tests). */
  openSpaceKey: (key: EditorialSpaceKey) => void;
  /**
   * `true` une fois l'hydratation localStorage terminée. Permet d'éviter
   * de rendre la sub-sidebar avec un état périmé pendant le SSR.
   */
  hydrated: boolean;
}

export function useEditorialRailState(): UseEditorialRailStateResult {
  const [openSpace, setOpenSpace] = useState<EditorialSpaceKey | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const initial = readPersistedSpace();
    if (initial !== null) {
      setOpenSpace(initial);
    }
    setHydrated(true);
  }, []);

  // Persist any change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    writePersistedSpace(openSpace);
  }, [openSpace, hydrated]);

  const toggleSpace = useCallback((key: EditorialSpaceKey) => {
    setOpenSpace((current) => (current === key ? null : key));
  }, []);

  const closeSpace = useCallback(() => {
    setOpenSpace(null);
  }, []);

  const openSpaceKey = useCallback((key: EditorialSpaceKey) => {
    setOpenSpace(key);
  }, []);

  return { openSpace, toggleSpace, closeSpace, openSpaceKey, hydrated };
}

// ============================================================================
// Helpers — exportés pour les tests
// ============================================================================

export const EDITORIAL_RAIL_STORAGE_KEY = STORAGE_KEY;

export function readPersistedSpace(): EditorialSpaceKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null) return null;
    if (typeof parsed === "string" && isValidSpaceKey(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    // Corrupted JSON, quota error, private mode → fall back to closed.
    return null;
  }
}

export function writePersistedSpace(value: EditorialSpaceKey | null): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Quota / private mode — silent.
  }
}

function isValidSpaceKey(value: string): value is EditorialSpaceKey {
  return VALID_SPACE_KEYS.has(value as EditorialSpaceKey);
}
