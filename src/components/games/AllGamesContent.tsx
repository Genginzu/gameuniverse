"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { EntityCard } from "@/components/shared/EntityCard";
import { gameCardConfig } from "@/components/shared/entityCardPresets";
import { GameFilters } from "./GameFilters";
import { GameFilterButton } from "./GameFilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { SearchSkeleton } from "./SearchSkeleton";
import { GamesEmptyState } from "./GamesEmptyState";
import { Genre } from "@/types/genre";
import { GameSummary } from "@/types/game";
import { Pagination as PaginationType } from "@/types/pagination";
import { PlatformFilterOption } from "@/types/platform";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";

interface AllGamesContentProps {
  locale?: string;
}

export function AllGamesContent({ locale = "fr" }: AllGamesContentProps) {
  const tErrors = useTranslations("errors");

  const [games, setGames] = useState<GameSummary[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<PlatformFilterOption[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
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

  // Fetch platforms au montage (prioritaire, avant les jeux)
  const fetchPlatforms = useCallback(async () => {
    const result = await executeAsync(async () => {
      const data = await apiClient.get(`/api/platforms?locale=${locale}`, {
        retryConfig: { maxAttempts: 2 },
      });
      return data.platforms || [];
    }, "fetchPlatforms");

    if (result) {
      setPlatforms(result);
    }
  }, [locale, apiClient, executeAsync]);

  // Fetch games avec gestion d'erreurs améliorée
  const fetchGames = useCallback(
    async (
      genres: string[] = [],
      publishers: string[] = [],
      page: number = 1,
      platforms: string[] = []
    ) => {
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

        if (platforms.length > 0) {
          params.append("platforms", platforms.join(","));
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

  // Ref stable pour éviter les re-triggers du useEffect
  const fetchGamesRef = useRef(fetchGames);
  fetchGamesRef.current = fetchGames;

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

  // Handle platform filter
  const handlePlatformFilter = useCallback((platforms: string[]) => {
    setSelectedPlatforms(platforms);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchGamesRef.current(selectedGenres, selectedPublishers, page, selectedPlatforms);
    },
    [selectedGenres, selectedPublishers, selectedPlatforms]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
    setSelectedPublishers([]);
    setSelectedPlatforms([]);
    // Les useEffect vont gérer le rechargement
  }, []);

  // Initial load - ne dépend PAS de fetchGames pour éviter la boucle
  useEffect(() => {
    // Charger filtres en priorité (genres + plateformes)
    fetchGenres();
    fetchPlatforms();

    // Puis charger les jeux
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
      fetchGamesRef.current(selectedGenres, selectedPublishers, 1, selectedPlatforms);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedGenres, selectedPublishers, selectedPlatforms, initialLoading]);

  // Show full skeleton on initial load
  if (initialLoading) {
    return <SearchSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <GameFilterButton
            hasFilters={
              selectedGenres.length > 0 ||
              selectedPublishers.length > 0 ||
              selectedPlatforms.length > 0
            }
            filterCount={selectedGenres.length + selectedPlatforms.length}
            onClick={() => setShowFilters(!showFilters)}
          />

          {/* Filter content below - full width */}
          <GameFilters
            genres={genres}
            platforms={platforms}
            selectedGenres={selectedGenres}
            selectedPublishers={selectedPublishers}
            selectedPlatforms={selectedPlatforms}
            onGenreChange={handleGenreFilter}
            onPublisherChange={handlePublisherFilter}
            onPlatformsChange={handlePlatformFilter}
            onClearFilters={handleClearFilters}
            showAllGenres={showFilters}
          />
        </div>

        {/* Loading state - Show skeleton grid instead of spinner */}
        {loading && !initialLoading && (
          <GridSkeleton skeletonConfig={gameSkeletonConfig} count={20} />
        )}

        {/* Games grid */}
        {!loading && (
          <>
            {games.length === 0 ? (
              <GamesEmptyState
                hasFilters={
                  selectedGenres.length > 0 ||
                  selectedPublishers.length > 0 ||
                  selectedPlatforms.length > 0
                }
                onClearFilters={handleClearFilters}
              />
            ) : (
              <div className="space-y-8">
                {/* Responsive grid - 5 columns layout */}
                <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {games.map((game, index) => (
                    <EntityCard
                      key={game.id}
                      entity={game}
                      config={gameCardConfig}
                      locale={locale}
                      priority={index < 4} // Priority loading pour les 4 premières cartes
                    />
                  ))}
                </div>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 sm:mt-12">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                  loading={loading}
                  translationNamespace="pagination"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
