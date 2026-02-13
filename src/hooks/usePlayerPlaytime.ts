"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
 * Récupère les stats au mount et permet de soumettre un temps de jeu.
 */
export function usePlayerPlaytime(slug: string): UsePlayerPlaytimeReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerPlaytimeStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/games/${slug}/playtime`);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch playtime stats");
      }

      const data: PlayerPlaytimeStats = await response.json();
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchStats();
  }, [fetchStats]);

  const submitPlaytime = useCallback(
    async (entry: Partial<PlayerPlaytimeEntry>): Promise<boolean> => {
      if (!user || !slug || submitting) return false;

      try {
        setSubmitting(true);
        setError(null);

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

        const updatedStats: PlayerPlaytimeStats = await response.json();
        setStats(updatedStats);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user, slug, submitting]
  );

  return { stats, loading, error, submitting, submitPlaytime };
}
