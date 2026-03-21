"use client";

import useSWR from "swr";
import type { PlayerAchievementWithDetails, PlayerXpStats } from "@/types/achievement";

interface AchievementsResponse {
  achievements: PlayerAchievementWithDetails[];
}

interface UseAchievementsReturn {
  achievements: PlayerAchievementWithDetails[];
  xpStats: PlayerXpStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook client pour récupérer les succès et stats XP d'un joueur.
 * Deux appels SWR en parallèle (dédupliqués et cachés indépendamment).
 */
export function useAchievements(playerId: string, locale: string): UseAchievementsReturn {
  const {
    data: achievementsData,
    error: achievementsError,
    isLoading: achievementsLoading,
  } = useSWR<AchievementsResponse>(
    playerId ? `/api/players/${playerId}/achievements?locale=${locale}` : null
  );

  const {
    data: xpData,
    error: xpError,
    isLoading: xpLoading,
  } = useSWR<PlayerXpStats>(playerId ? `/api/players/${playerId}/xp` : null);

  const firstError = achievementsError || xpError;

  return {
    achievements: achievementsData?.achievements ?? [],
    xpStats: xpData ?? null,
    isLoading: achievementsLoading || xpLoading,
    error: firstError
      ? firstError instanceof Error
        ? firstError.message
        : "Failed to fetch achievements"
      : null,
  };
}
