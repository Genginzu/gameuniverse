"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { SubscriptionService } from "@/lib/services/subscriptionService";
import { useAuth } from "@/hooks/useAuth";
import type { SubscriptionStatus } from "@/types/subscription";

export interface UseSubscriptionRelationshipReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  error: string | null;
}

/**
 * Hook pour le bouton S'abonner / Se désabonner sur un profil visité.
 * Gère l'optimistic update avec rollback sur erreur.
 */
export function useSubscriptionRelationship(targetId: string): UseSubscriptionRelationshipReturn {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;
  const isOwner = viewerId === targetId;

  const shouldFetch = !!viewerId && !!targetId && !isOwner;
  const swrKey = shouldFetch ? `/api/players/${viewerId}/subscriptions/${targetId}` : null;

  const { data, isLoading, mutate } = useSWR<SubscriptionStatus>(swrKey, {
    revalidateOnFocus: false,
  });

  const [error, setError] = useState<string | null>(null);

  const isSubscribed = data?.isSubscribed ?? false;

  const subscribe = useCallback(async () => {
    if (!viewerId || !targetId || isOwner) return;
    await mutate({ isSubscribed: true }, false);
    setError(null);
    try {
      await SubscriptionService.subscribe(viewerId, targetId);
    } catch (err) {
      await mutate();
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    }
  }, [viewerId, targetId, isOwner, mutate]);

  const unsubscribe = useCallback(async () => {
    if (!viewerId || !targetId || isOwner) return;
    await mutate({ isSubscribed: false }, false);
    setError(null);
    try {
      await SubscriptionService.unsubscribe(viewerId, targetId);
    } catch (err) {
      await mutate();
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
    }
  }, [viewerId, targetId, isOwner, mutate]);

  return {
    isSubscribed,
    isLoading: shouldFetch && isLoading,
    subscribe,
    unsubscribe,
    error,
  };
}
