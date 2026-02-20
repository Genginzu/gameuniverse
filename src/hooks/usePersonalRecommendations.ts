"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameRecommendation } from "@/types/recommendation";

interface UsePersonalRecommendationsReturn {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour fetch les recommandations personnalisées via l'API.
 * Agrège les recommandations de tous les jeux de la bibliothèque du joueur.
 */
export function usePersonalRecommendations(): UsePersonalRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
  const [basedOnGameCount, setBasedOnGameCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/recommendations/personal");
      if (!response.ok) {
        throw new Error("Failed to fetch personal recommendations");
      }
      const json = await response.json();
      setRecommendations(json.recommendations ?? []);
      setBasedOnGameCount(json.basedOnGameCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch personal recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    basedOnGameCount,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}
