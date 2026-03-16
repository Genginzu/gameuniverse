"use client";

import { useState, useEffect, useCallback } from "react";
import { DiscussionService } from "@/lib/services/discussionService";
import { useAuth } from "@/hooks/useAuth";

export interface UseUnreadCountReturn {
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer et gérer le compteur global de messages non lus.
 * Ne fetch que si l'utilisateur est authentifié. Retourne 0 en cas d'erreur.
 */
export function useUnreadCount(): UseUnreadCountReturn {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await DiscussionService.fetchUnreadCount();
      setCount(response.count);
    } catch {
      // Fallback silencieux : on affiche 0 en cas d'erreur (pattern existant)
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchCount();
  }, [user?.id, fetchCount]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await fetchCount();
  }, [user?.id, fetchCount]);

  return { count, isLoading, refresh };
}
