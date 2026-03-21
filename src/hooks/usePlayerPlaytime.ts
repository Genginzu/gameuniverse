"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
import type { PlayerPlaytimeStats, PlayerPlaytimeEntry } from "@/types/game";

interface UsePlayerPlaytimeReturn {
  stats: PlayerPlaytimeStats;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  submitPlaytime: (entry: Partial<PlayerPlaytimeEntry>) => Promise<boolean>;
}

const EMPTY_STATS: PlayerPlaytimeStats = {
  averages: { hastily: null, normally: null, completely: null },
  count: 0,
  userPlaytime: null,
  contributors: [],
};

/**
 * Hook pour gérer le temps de jeu des joueurs (3 catégories).
 * SWR gère la lecture, la mutation submit reste manuelle.
 */
export function usePlayerPlaytime(slug: string): UsePlayerPlaytimeReturn {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<PlayerPlaytimeStats>(
    slug ? `/api/games/${slug}/playtime` : null
  );

  const submitPlaytime = useCallback(
    async (entry: Partial<PlayerPlaytimeEntry>): Promise<boolean> => {
      if (!user || !slug || submitting) return false;

      try {
        setSubmitting(true);
        setMutationError(null);

        const response = await fetch(`/api/games/${slug}/playtime`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playTimeHastily: entry.hastily ?? null,
            playTimeNormally: entry.normally ?? null,
            playTimeCompletely: entry.completely ?? null,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to submit playtime");
        }

        // L'API retourne les stats mises à jour — on met à jour le cache SWR
        const updatedStats: PlayerPlaytimeStats = await response.json();
        await mutate(updatedStats, false);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setMutationError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user, slug, submitting, mutate]
  );

  const fetchError = error ? (error instanceof Error ? error.message : "Unknown error") : null;

  return {
    stats: data ?? EMPTY_STATS,
    loading: isLoading,
    error: mutationError || fetchError,
    submitting,
    submitPlaytime,
  };
}
