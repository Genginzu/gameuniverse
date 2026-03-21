"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
import { GameSummary } from "@/types/game";
import { Genre } from "@/types/genre";
import { Pagination } from "@/types/pagination";

interface LibraryStats {
  totalGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating?: number;
}

interface GamesResponse {
  games: GameSummary[];
  pagination: Pagination | null;
}

interface GenresResponse {
  genres: Genre[];
}

/** Construit l'URL SWR pour les jeux de la bibliothèque */
function buildGamesKey(
  locale: string,
  page: number,
  search: string,
  genres: string[],
  publishers: string[]
): string {
  const params = new URLSearchParams({
    locale,
    page: page.toString(),
    limit: "20",
    inLibrary: "true",
  });

  if (search.trim()) params.append("search", search.trim());
  if (genres.length > 0) params.append("genres", genres.join(","));
  if (publishers.length > 0) params.append("publishers", publishers.join(","));

  return `/api/games?${params.toString()}`;
}

/**
 * Hook SWR pour la page bibliothèque.
 * Gère les jeux (avec filtres/pagination), les stats et les genres.
 */
export function useLibraryGames(locale: string = "fr") {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced values pour éviter les appels API à chaque frappe
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedGenres, setDebouncedGenres] = useState<string[]>([]);
  const [debouncedPublishers, setDebouncedPublishers] = useState<string[]>([]);
  const isInitialMount = useRef(true);

  // Debounce des filtres (300ms)
  useEffect(() => {
    // Pas de debounce au premier rendu
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setDebouncedGenres(selectedGenres);
      setDebouncedPublishers(selectedPublishers);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGenres, selectedPublishers]);

  // SWR — jeux de la bibliothèque
  const gamesKey = user
    ? buildGamesKey(locale, currentPage, debouncedSearch, debouncedGenres, debouncedPublishers)
    : null;

  const {
    data: gamesData,
    isLoading: gamesLoading,
    isValidating: gamesValidating,
    mutate: mutateGames,
  } = useSWR<GamesResponse>(gamesKey);

  // SWR — stats
  const { data: statsData, mutate: mutateStats } = useSWR<LibraryStats>(
    user ? "/api/library/stats" : null
  );

  // SWR — genres
  const { data: genresData } = useSWR<GenresResponse>(user ? `/api/genres?locale=${locale}` : null);

  const games = gamesData?.games ?? [];
  const pagination = gamesData?.pagination ?? null;
  const stats: LibraryStats = statsData ?? {
    totalGames: 0,
    completedGames: 0,
    totalPlayTime: 0,
  };
  const genres = genresData?.genres ?? [];

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleGenreFilter = useCallback((genres: string[]) => {
    setSelectedGenres(genres);
  }, []);

  const handlePublisherFilter = useCallback((publishers: string[]) => {
    setSelectedPublishers(publishers);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGenres([]);
    setSelectedPublishers([]);
    setDebouncedSearch("");
    setDebouncedGenres([]);
    setDebouncedPublishers([]);
    setCurrentPage(1);
  }, []);

  const handleGameRemoved = useCallback(
    (gameId: string) => {
      // Mise à jour optimiste du cache SWR
      mutateGames(
        (current) => {
          if (!current) return current;
          return {
            ...current,
            games: current.games.filter((g) => g.id !== gameId),
            pagination: current.pagination
              ? {
                  ...current.pagination,
                  totalCount: Math.max(0, current.pagination.totalCount - 1),
                }
              : null,
          };
        },
        { revalidate: false }
      );
      mutateStats(
        (current) => {
          if (!current) return current;
          return { ...current, totalGames: Math.max(0, current.totalGames - 1) };
        },
        { revalidate: false }
      );
    },
    [mutateGames, mutateStats]
  );

  const hasActiveFilters =
    searchQuery !== "" || selectedGenres.length > 0 || selectedPublishers.length > 0;

  return {
    // Data
    games,
    stats,
    genres,
    pagination,
    // Loading states
    initialLoading: gamesLoading,
    loading: gamesValidating,
    // Filter state
    searchQuery,
    selectedGenres,
    selectedPublishers,
    hasActiveFilters,
    // Handlers
    handleSearch,
    handleGenreFilter,
    handlePublisherFilter,
    handlePageChange,
    handleClearFilters,
    handleGameRemoved,
  };
}
