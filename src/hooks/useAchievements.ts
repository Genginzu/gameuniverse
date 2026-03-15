"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlayerAchievementWithDetails, PlayerXpStats } from "@/types/achievement";

interface UseAchievementsReturn {
  achievements: PlayerAchievementWithDetails[];
  xpStats: PlayerXpStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook client pour récupérer les succès et stats XP d'un joueur.
 * Charge les deux endpoints en parallèle au mount.
 */
export function useAchievements(playerId: string, locale: string): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<PlayerAchievementWithDetails[]>([]);
  const [xpStats, setXpStats] = useState<PlayerXpStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (signal: AbortSignal) => {
      if (!playerId) return;

      try {
        setIsLoading(true);
        setError(null);

        const [achievementsRes, xpRes] = await Promise.all([
          fetch(`/api/players/${playerId}/achievements?locale=${locale}`, { signal }),
          fetch(`/api/players/${playerId}/xp`, { signal }),
        ]);

        if (!achievementsRes.ok) {
          const data = await achievementsRes.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to fetch achievements");
        }

        if (!xpRes.ok) {
          const data = await xpRes.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to fetch XP stats");
        }

        const achievementsData = await achievementsRes.json();
        const xpData: PlayerXpStats = await xpRes.json();

        setAchievements(achievementsData.achievements);
        setXpStats(xpData);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [playerId, locale]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  return { achievements, xpStats, isLoading, error };
}
