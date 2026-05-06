"use client";

import useSWR from "swr";
import { GameSummary, GameListingSort, DEFAULT_GAME_LISTING_SORT } from "@/types/game";
import { Genre } from "@/types/genre";
import { PlatformFilterOption } from "@/types/platform";
import { Pagination } from "@/types/pagination";

export interface GamesApiResponse {
  games: GameSummary[];
  pagination: Pagination;
}

interface GenresApiResponse {
  genres: Genre[];
}

interface PlatformsApiResponse {
  platforms: PlatformFilterOption[];
}

/** Construit l'URL API pour le listing des jeux avec filtres */
function buildGamesUrl(
  locale: string,
  page: number,
  genres: string[],
  platforms: string[],
  sort: GameListingSort,
  esport: boolean | null = null
): string {
  const params = new URLSearchParams({ locale, page: String(page), limit: "20" });
  if (genres.length > 0) params.set("genres", genres.join(","));
  if (platforms.length > 0) params.set("platforms", platforms.join(","));
  if (sort !== DEFAULT_GAME_LISTING_SORT) params.set("sort", sort);
  if (esport !== null) params.set("esport", String(esport));
  return `/api/games?${params.toString()}`;
}

/** Fetcher générique pour SWR — utilise fetch client-side (URL relative) */
async function apiFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Hook SWR pour le listing des jeux avec filtres et pagination.
 * `fallbackData` permet d'injecter les données SSR pour un rendu immédiat sans skeleton.
 */
export function useGameListing(
  locale: string,
  page: number,
  genres: string[],
  platforms: string[],
  sort: GameListingSort = DEFAULT_GAME_LISTING_SORT,
  esport: boolean | null = null,
  fallbackData?: GamesApiResponse
) {
  const url = buildGamesUrl(locale, page, genres, platforms, sort, esport);

  const { data, error, isLoading, isValidating } = useSWR<GamesApiResponse>(url, apiFetcher, {
    fallbackData,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return {
    games: data?.games ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading,
    validating: isValidating,
    error: error ? (error instanceof Error ? error.message : "Unknown error") : null,
  };
}

/** Hook SWR pour les genres (chargés une seule fois, cache long) */
export function useGenres(locale: string) {
  const { data, isLoading } = useSWR<GenresApiResponse>(
    `/api/genres?locale=${locale}`,
    apiFetcher,
    { revalidateOnFocus: false }
  );
  return { genres: data?.genres ?? [], loading: isLoading };
}

/** Hook SWR pour les plateformes (chargées une seule fois, cache long) */
export function usePlatforms(locale: string) {
  const { data, isLoading } = useSWR<PlatformsApiResponse>(
    `/api/platforms?locale=${locale}`,
    apiFetcher,
    { revalidateOnFocus: false }
  );
  return { platforms: data?.platforms ?? [], loading: isLoading };
}
