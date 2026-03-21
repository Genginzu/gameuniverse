"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";

interface UnreadCountResponse {
  count: number;
}

export interface UseUnreadCountReturn {
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer le compteur global de messages non lus.
 * SWR gère le fetch + cache. Retourne 0 si pas authentifié.
 */
export function useUnreadCount(): UseUnreadCountReturn {
  const { user } = useAuth();

  const { data, isLoading, mutate } = useSWR<UnreadCountResponse>(
    user?.id ? "/api/discussions/unread-count" : null,
    {
      // Fallback silencieux : 0 en cas d'erreur (pattern existant)
      onError: () => {},
    }
  );

  const count = data?.count ?? 0;

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await mutate();
  }, [user?.id, mutate]);

  return { count, isLoading, refresh };
}
