"use client";

import { useState, useEffect, useCallback } from "react";
import { GameCard } from "./GameCard";
import { GameSearchBar } from "./GameSearchBar";
import { GameFilters } from "./GameFilters";
import { GameFilterButton } from "./GameFilterButton";
import { GamePagination } from "./GamePagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Genre } from "@/types/genre";
import { GameSummary } from "@/types/game";
import { Pagination } from "@/types/pagination";

interface AllGamesContentProps {
  locale?: string;
}

export function AllGamesContent({ locale = "fr" }: AllGamesContentProps) {
  // const t = useTranslations("games"); // Unused for now

  const [games, setGames] = useState<GameSummary[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    try {
      console.log("Fetching genres for locale:", locale);
      const response = await fetch(`/api/genres?locale=${locale}`);
      console.log("Genres API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Genres API error:", errorText);
        throw new Error("Failed to fetch genres");
      }

      const data = await response.json();
      console.log("Genres API data:", data);

      setGenres(data.genres || []);
    } catch (err) {
      console.error("Error fetching genres:", err);
    }
  }, [locale]);

  // Fetch games
  const fetchGames = useCallback(
    async (
      search: string = "",
      genres: string[] = [],
      publishers: string[] = [],
      page: number = 1
    ) => {
      console.log("🎮 fetchGames called with:", { search, genres, publishers, page });
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          locale,
          page: page.toString(),
          limit: "20",
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (genres.length > 0) {
          params.append("genres", genres.join(","));
        }

        if (publishers.length > 0) {
          params.append("publishers", publishers.join(","));
        }

        const response = await fetch(`/api/games?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setGames(data.games || []);
        setPagination(data.pagination || null);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Le useEffect va gérer l'appel à fetchGames
  }, []);

  // Handle genre filter
  const handleGenreFilter = useCallback((genres: string[]) => {
    setSelectedGenres(genres);
    // Le useEffect va gérer l'appel à fetchGames
  }, []);

  // Handle publisher filter
  const handlePublisherFilter = useCallback((publishers: string[]) => {
    setSelectedPublishers(publishers);
    // Le useEffect va gérer l'appel à fetchGames
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchGames(searchQuery, selectedGenres, selectedPublishers, page);
    },
    [fetchGames, searchQuery, selectedGenres, selectedPublishers]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGenres([]);
    setSelectedPublishers([]);
    // Les useEffect vont gérer le rechargement
  }, []);

  // Initial load
  useEffect(() => {
    fetchGenres();
    fetchGames();
  }, [fetchGenres, fetchGames]);

  // Effect pour gérer les changements de filtres avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGames(searchQuery, selectedGenres, selectedPublishers, 1);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGenres, selectedPublishers, fetchGames]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Erreur: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-12 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Découvrez des Jeux
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Extraordinaires
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-indigo-100/90">
              Explorez notre collection de jeux vidéo exceptionnels
            </p>
            {pagination && (
              <div className="mt-4 inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur-sm">
                <svg
                  className="mr-2 h-4 w-4 text-yellow-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                <span className="font-medium">{pagination.totalCount}</span>
                <span className="ml-1 text-indigo-200">jeux disponibles</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative elements - plus subtils */}
        <div className="absolute -left-2 top-1/3 h-16 w-16 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -right-4 top-2/3 h-20 w-20 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute -top-4 left-1/4 h-12 w-12 rounded-full bg-yellow-400/10 blur-lg"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar with filter button - same row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <GameSearchBar onSearch={handleSearch} initialValue={searchQuery} />
            </div>
            <div className="flex-shrink-0">
              <GameFilterButton
                hasFilters={selectedGenres.length > 0 || selectedPublishers.length > 0}
                filterCount={selectedGenres.length}
                onClick={() => setShowFilters(!showFilters)}
              />
            </div>
          </div>

          {/* Filter content below - full width */}
          <GameFilters
            genres={genres}
            selectedGenres={selectedGenres}
            selectedPublishers={selectedPublishers}
            onGenreChange={handleGenreFilter}
            onPublisherChange={handlePublisherFilter}
            onClearFilters={handleClearFilters}
            showAllGenres={showFilters}
          />
        </div>

        {/* Results info */}
        {pagination && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              {searchQuery ? (
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-blue-600">{pagination.totalCount}</span> résultat(s) pour "
                  {searchQuery}"
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-blue-600">{pagination.totalCount}</span> jeux au total
                </p>
              )}
            </div>
            {(selectedGenres.length > 0 || selectedPublishers.length > 0) && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>Filtres actifs</span>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Chargement des jeux...</p>
          </div>
        )}

        {/* Games grid */}
        {!loading && (
          <>
            {games.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center shadow-sm">
                <div className="mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-6">
                  <svg
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Aucun jeu trouvé</h3>
                <p className="max-w-md text-gray-500">
                  {searchQuery || selectedGenres.length > 0 || selectedPublishers.length > 0
                    ? "Essayez de modifier vos critères de recherche ou explorez d'autres catégories"
                    : "Aucun jeu disponible pour le moment"}
                </p>
                {(searchQuery || selectedGenres.length > 0 || selectedPublishers.length > 0) && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} locale={locale} />
                  ))}
                </div>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12">
                <GamePagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
