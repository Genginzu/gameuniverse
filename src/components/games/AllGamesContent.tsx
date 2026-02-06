"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { GameCard } from "./GameCard";
import { GameSearchBar } from "./GameSearchBar";
import { GameFilters } from "./GameFilters";
import { GameFilterButton } from "./GameFilterButton";
import { GamePagination } from "./GamePagination";
import { GameGridSkeleton } from "./GameGridSkeleton";
import { SearchSkeleton } from "./SearchSkeleton";
import { Genre } from "@/types/genre";
import { GameSummary } from "@/types/game";
import { Pagination } from "@/types/pagination";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";

interface AllGamesContentProps {
  locale?: string;
}

export function AllGamesContent({ locale = "fr" }: AllGamesContentProps) {
  const t = useTranslations("games");
  const tErrors = useTranslations("errors");

  const [games, setGames] = useState<GameSummary[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Utiliser notre nouveau système de gestion d'erreurs
  const apiClient = useApiClient();
  const { executeAsync } = useAsyncError();

  // Fetch genres avec gestion d'erreurs améliorée
  const fetchGenres = useCallback(async () => {
    const result = await executeAsync(async () => {
      const data = await apiClient.get(`/api/genres?locale=${locale}`, {
        retryConfig: {
          maxAttempts: 2, // Moins de tentatives pour les genres
        },
      });

      return data.genres || [];
    }, "fetchGenres");

    if (result) {
      setGenres(result);
    }
  }, [locale, apiClient, executeAsync]);

  // Fetch games avec gestion d'erreurs améliorée
  const fetchGames = useCallback(
    async (genres: string[] = [], publishers: string[] = [], page: number = 1) => {
      setLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          locale,
          page: page.toString(),
          limit: "20",
        });

        if (genres.length > 0) {
          params.append("genres", genres.join(","));
        }

        if (publishers.length > 0) {
          params.append("publishers", publishers.join(","));
        }

        const data = await apiClient.get(`/api/games?${params.toString()}`, {
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
          },
        });

        return {
          games: data.games || [],
          pagination: data.pagination || null,
        };
      }, "fetchGames");

      if (result) {
        setGames(result.games);
        setPagination(result.pagination);
      } else {
        // En cas d'erreur, on garde les données précédentes mais on affiche un toast
        toast({
          variant: "destructive",
          title: tErrors("loadingError"),
          description: tErrors("loadingErrorDescription"),
        });
      }

      setLoading(false);
      setInitialLoading(false);
    },
    [locale, apiClient, executeAsync]
  );

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
      fetchGames(selectedGenres, selectedPublishers, page);
    },
    [fetchGames, selectedGenres, selectedPublishers]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
    setSelectedPublishers([]);
    // Les useEffect vont gérer le rechargement
  }, []);

  // Initial load - ne dépend PAS de fetchGames pour éviter la boucle
  useEffect(() => {
    fetchGenres();
    // Appel direct sans dépendre de fetchGames
    const loadInitialGames = async () => {
      setLoading(true);
      setInitialLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          locale,
          page: "1",
          limit: "20",
        });

        const data = await apiClient.get(`/api/games?${params.toString()}`, {
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
          },
        });

        return {
          games: data.games || [],
          pagination: data.pagination || null,
        };
      }, "fetchGames");

      if (result) {
        setGames(result.games);
        setPagination(result.pagination);
      }

      setLoading(false);
      setInitialLoading(false);
    };

    loadInitialGames();
  }, []); // Seulement au montage initial

  // Effect pour gérer les changements de filtres avec debounce
  useEffect(() => {
    // Ne pas exécuter lors du chargement initial
    if (initialLoading) return;

    const timeoutId = setTimeout(() => {
      fetchGames(selectedGenres, selectedPublishers, 1);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [selectedGenres, selectedPublishers, fetchGames]); // Inclure fetchGames

  // Show full skeleton on initial load
  if (initialLoading) {
    return <SearchSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl xl:text-5xl">
              {t("heroTitle")}
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t("heroTitleHighlight")}
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-indigo-100/90 sm:text-lg">
              {t("heroSubtitle")}
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
                <span>{t("availableCount", { count: pagination.totalCount })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative elements - plus subtils */}
        <div className="absolute -left-2 top-1/3 h-16 w-16 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -right-4 top-2/3 h-20 w-20 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute -top-4 left-1/4 h-12 w-12 rounded-full bg-yellow-400/10 blur-lg"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          {/* Search bar with filter button - responsive layout */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <GameSearchBar locale={locale} />
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

        {/* Loading state - Show skeleton grid instead of spinner */}
        {loading && !initialLoading && <GameGridSkeleton count={20} />}

        {/* Games grid */}
        {!loading && (
          <>
            {games.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm sm:py-20 dark:bg-gray-800">
                <div className="mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-6 dark:from-gray-700 dark:to-gray-600">
                  <svg
                    className="h-12 w-12 text-gray-400 sm:h-16 sm:w-16"
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
                <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
                  {t("noGamesFound")}
                </h3>
                <p className="max-w-md text-sm text-gray-500 sm:text-base dark:text-gray-400">
                  {selectedGenres.length > 0 || selectedPublishers.length > 0
                    ? t("modifySearch")
                    : t("noGamesAvailable")}
                </p>
                {(selectedGenres.length > 0 || selectedPublishers.length > 0) && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {t("clearFilters")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Responsive grid - 5 columns layout */}
                <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {games.map((game, index) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      locale={locale}
                      priority={index < 4} // Priority loading pour les 4 premières cartes
                    />
                  ))}
                </div>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 sm:mt-12">
                <GamePagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                  loading={loading}
                  locale={locale}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
