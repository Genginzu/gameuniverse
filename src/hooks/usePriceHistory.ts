"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PriceSnapshot, PriceHistoryStats, PriceHistoryFilters } from "@/types/price-history";
import { fetchPriceHistory } from "@/lib/services/priceHistoryService";

export interface UsePriceHistoryReturn {
  history: PriceSnapshot[];
  stats: PriceHistoryStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook pour récupérer l'historique de prix d'un jeu.
 * Refetch automatique quand le slug ou les filtres changent.
 *
 * @param gameSlug - Le slug du jeu
 * @param filters - Filtres (période, magasin, plateforme)
 * @returns Historique, statistiques, état de chargement, erreur et refetch
 */
export function usePriceHistory(
  gameSlug: string,
  filters: PriceHistoryFilters
): UsePriceHistoryReturn {
  const [history, setHistory] = useState<PriceSnapshot[]>([]);
  const [stats, setStats] = useState<PriceHistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!gameSlug) {
      setIsLoading(false);
      return;
    }

    cancelledRef.current = false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchPriceHistory(gameSlug, filters);

      if (!cancelledRef.current) {
        setHistory(response.history);
        setStats(response.stats);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        const message = err instanceof Error ? err.message : "Unknown error occurred";
        setError(message);
        setHistory([]);
        setStats(null);
      }
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
      }
    }
  }, [gameSlug, filters.period, filters.store, filters.platform]);

  useEffect(() => {
    loadData();

    return () => {
      cancelledRef.current = true;
    };
  }, [loadData]);

  return { history, stats, isLoading, error, refetch: loadData };
}
