"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";

interface PendingCountResponse {
  count: number;
}

export interface UsePendingRequestCountReturn {
  count: number;
  isLoading: boolean;
  decrement: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer et gérer le compteur de demandes d'amitié en attente.
 * SWR gère le fetch + cache. Retourne 0 si pas authentifié.
 */
export function usePendingRequestCount(): UsePendingRequestCountReturn {
  const { user } = useAuth();

  const { data, isLoading, mutate } = useSWR<PendingCountResponse>(
    user?.id ? "/api/players/me/friends/pending-count" : null,
    {
      // Fallback silencieux : 0 en cas d'erreur (pattern existant)
      onError: () => {},
    }
  );

  const count = data?.count ?? 0;

  const decrement = useCallback(() => {
    // Optimistic update du cache sans revalidation
    mutate({ count: Math.max(0, count - 1) }, false);
  }, [count, mutate]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await mutate();
  }, [user?.id, mutate]);

  return { count, isLoading, decrement, refresh };
}
