"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameRecommendation } from "@/types/recommendation";

interface UseRecommendationsReturn {
  recommendations: GameRecommendation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour fetch les recommandations d'un jeu via l'API.
 * Gère les états loading, error, data.
 */
export function useRecommendations(gameSlug: string): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchRecommendations = useCallback(async () => {
    if (!gameSlug) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/games/${gameSlug}/recommendations`);
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }
      const json = await response.json();
      setRecommendations(json.recommendations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  }, [gameSlug]);

  useEffect(() => {
    if (hasFetchedRef.current || !gameSlug) {
      if (!gameSlug) setLoading(false);
      return;
    }
    hasFetchedRef.current = true;
    fetchRecommendations();
  }, [gameSlug, fetchRecommendations]);

  return { recommendations, loading, error, refetch: fetchRecommendations };
}
