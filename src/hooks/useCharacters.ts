"use client";

import useSWR from "swr";
import type { CharacterSummary } from "@/types/character";
import type { Pagination } from "@/types/pagination";
import type { UseCharactersOptions, UseCharactersReturn } from "@/types/hooks";

interface CharactersResponse {
  characters: CharacterSummary[];
  pagination: Pagination;
}

/**
 * Construit la clé SWR (= URL de l'API) à partir des options de filtrage.
 * Retourne null si aucune locale n'est fournie (désactive le fetch).
 */
function buildCharactersKey(options: UseCharactersOptions): string | null {
  const { locale, page = 1, limit = 20, search, roles, platforms } = options;
  if (!locale) return null;

  const params = new URLSearchParams({ locale, page: String(page), limit: String(limit) });
  if (search?.trim()) params.append("search", search.trim());
  if (roles && roles.length > 0) params.append("roles", roles.join(","));
  if (platforms && platforms.length > 0) params.append("platforms", platforms.join(","));

  return `/api/characters?${params.toString()}`;
}

/**
 * Hook SWR pour le listing paginé des personnages.
 * Utilise le fetcher global (SWRProvider) — cache, déduplication et revalidation automatiques.
 *
 * `fallbackData` permet d'injecter les données SSR pour un rendu immédiat sans skeleton.
 */
export function useCharacters(
  options: UseCharactersOptions,
  fallbackData?: CharactersResponse
): UseCharactersReturn {
  const key = buildCharactersKey(options);

  const { data, error, isLoading, isValidating, mutate } = useSWR<CharactersResponse>(key, {
    fallbackData,
    // Pas de revalidation au focus pour les listings filtrés — l'utilisateur
    // contrôle le rafraîchissement via les filtres et la pagination
    revalidateOnFocus: false,
    // Garder les données précédentes pendant le fetch d'une nouvelle page/filtre
    keepPreviousData: true,
  });

  return {
    characters: data?.characters ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : "Unknown error") : null,
    refetch: async () => {
      await mutate();
    },
  };
}
