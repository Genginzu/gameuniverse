"use client";

import { useState, useEffect, useCallback } from "react";
import { FriendService } from "@/lib/services/friendService";
import { useAuth } from "@/hooks/useAuth";

export interface UsePendingRequestCountReturn {
  count: number;
  isLoading: boolean;
  decrement: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer et gérer le compteur de demandes d'amitié en attente.
 * Ne fetch que si l'utilisateur est authentifié. Retourne 0 en cas d'erreur.
 */
export function usePendingRequestCount(): UsePendingRequestCountReturn {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await FriendService.getPendingCount();
      setCount(response.count);
    } catch {
      // Fallback silencieux : on affiche 0 en cas d'erreur
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchCount();
  }, [user?.id, fetchCount]);

  const decrement = useCallback(() => {
    setCount((prev) => Math.max(0, prev - 1));
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await fetchCount();
  }, [user?.id, fetchCount]);

  return { count, isLoading, decrement, refresh };
}
