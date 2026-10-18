"use client";

import useSWR from "swr";
import type { SubscriptionCounts } from "@/types/subscription";

export interface UseSubscriptionCountsReturn {
  followers: number;
  following: number;
  isLoading: boolean;
  mutate: () => Promise<unknown>;
}

/**
 * Hook léger pour les compteurs d'abonnés / abonnements affichés sur le
 * profil joueur. Utilise l'endpoint public `/subscriptions/count`.
 */
export function useSubscriptionCounts(playerId: string): UseSubscriptionCountsReturn {
  const { data, isLoading, mutate } = useSWR<SubscriptionCounts>(
    playerId ? `/api/players/${playerId}/subscriptions/count` : null,
    { revalidateOnFocus: false }
  );

  return {
    followers: data?.followers ?? 0,
    following: data?.following ?? 0,
    isLoading,
    mutate,
  };
}
