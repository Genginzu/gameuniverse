"use client";

import useSWR from "swr";
import { GameDetails, GameSummary } from "@/types/game";
import { GameService } from "@/lib/services/gameService";
import { UseGameDetailsReturn, UseGamesOptions, UseGamesReturn } from "@/types/hooks";

/**
 * Hook pour récupérer les détails d'un jeu côté client.
 * Utilise SWR pour le cache, la déduplication et la revalidation automatique.
 */
export function useGameDetails(slug: string, locale: string = "fr"): UseGameDetailsReturn {
  const { data, error, isLoading, mutate } = useSWR<GameDetails | null>(
    slug ? `/api/games/${slug}?locale=${locale}` : null
  );

  return {
    game: data ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Unknown error") : null,
    refetch: async () => {
      await mutate();
    },
  };
}

/**
 * Hook pour récupérer la liste des jeux côté client.
 * Utilise le GameService existant (server-side fetch) car la construction
 * des query params est complexe avec genres[].
 */
export function useGames(options: UseGamesOptions = {}): UseGamesReturn {
  const key = options
    ? JSON.stringify([
        "games",
        options.search,
        options.genres,
        options.page,
        options.limit,
        options.locale,
      ])
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, () => GameService.fetchGames(options));

  return {
    games: data?.games ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Unknown error") : null,
    refetch: async () => {
      await mutate();
    },
  };
}
