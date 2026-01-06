"use client";

import { useState, useEffect } from "react";
import { GameDetails, GameSummary } from "@/types/game";
import { GameService } from "@/lib/services/gameService";

interface UseGameDetailsReturn {
  game: GameDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les détails d'un jeu côté client
 * Utile pour les composants qui ont besoin de recharger les données dynamiquement
 *
 * @param slug - Le slug du jeu
 * @param locale - La locale (fr, en)
 * @returns État de chargement, données du jeu, erreur et fonction de rechargement
 */
export function useGameDetails(slug: string, locale: string = "fr"): UseGameDetailsReturn {
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGame = async () => {
    try {
      setLoading(true);
      setError(null);

      const gameDetails = await GameService.fetchGameDetails(slug, locale);
      setGame(gameDetails);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setGame(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchGame();
    }
  }, [slug, locale]);

  const refetch = async () => {
    await fetchGame();
  };

  return {
    game,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook pour récupérer la liste des jeux côté client
 * Utile pour les composants de recherche et filtrage dynamiques
 */
export function useGames(
  options: {
    search?: string;
    genres?: string[];
    page?: number;
    limit?: number;
    locale?: string;
  } = {}
) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await GameService.fetchGames(options);
      setGames(result.games);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setGames([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [options.search, options.genres?.join(","), options.page, options.limit, options.locale]);

  const refetch = async () => {
    await fetchGames();
  };

  return {
    games,
    pagination,
    loading,
    error,
    refetch,
  };
}
