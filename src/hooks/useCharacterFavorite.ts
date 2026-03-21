"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";

interface FavoriteCountResponse {
  count: number;
}

interface FavoriteStatusResponse {
  isFavorite: boolean;
}

export interface UseCharacterFavoriteReturn {
  isFavorite: boolean;
  favoriteCount: number;
  isLoading: boolean;
  isToggling: boolean;
  error: string | null;
  toggleFavorite: () => Promise<void>;
}

/**
 * Hook pour gérer le favori d'un personnage.
 * SWR gère la lecture (count public + status auth), toggle reste manuel avec optimistic update.
 */
export function useCharacterFavorite(characterSlug: string): UseCharacterFavoriteReturn {
  const { user } = useAuth();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Count public — pas besoin d'auth
  const { data: countData, mutate: mutateCount } = useSWR<FavoriteCountResponse>(
    characterSlug ? `/api/characters/${characterSlug}/favorite/count` : null
  );

  // Status utilisateur — seulement si authentifié
  const {
    data: statusData,
    isLoading: statusLoading,
    mutate: mutateStatus,
  } = useSWR<FavoriteStatusResponse>(
    characterSlug && user ? `/api/characters/${characterSlug}/favorite` : null
  );

  const isFavorite = statusData?.isFavorite ?? false;
  const favoriteCount = countData?.count ?? 0;

  // Le loading est terminé quand le count est chargé ET (pas d'user OU status chargé)
  const isLoading = !countData || (!!user && statusLoading);

  const toggleFavorite = useCallback(async () => {
    if (!user || !characterSlug || isToggling) return;

    const prevIsFavorite = isFavorite;
    const prevCount = favoriteCount;

    // Optimistic update
    mutateStatus({ isFavorite: !prevIsFavorite }, false);
    mutateCount({ count: prevIsFavorite ? prevCount - 1 : prevCount + 1 }, false);
    setIsToggling(true);
    setError(null);

    try {
      const method = prevIsFavorite ? "DELETE" : "POST";
      const res = await fetch(`/api/characters/${characterSlug}/favorite`, { method });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "An error occurred");
      }
    } catch (err) {
      // Rollback on error
      mutateStatus({ isFavorite: prevIsFavorite }, false);
      mutateCount({ count: prevCount }, false);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsToggling(false);
    }
  }, [user, characterSlug, isToggling, isFavorite, favoriteCount, mutateStatus, mutateCount]);

  return { isFavorite, favoriteCount, isLoading, isToggling, error, toggleFavorite };
}
