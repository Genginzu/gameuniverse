"use client";

import { useState, useEffect, useCallback } from "react";
import { GameCard } from "@/components/games/GameCard";
import { GameSearchBar } from "@/components/games/GameSearchBar";
import { GameFilters } from "@/components/games/GameFilters";
import { GameFilterButton } from "@/components/games/GameFilterButton";
import { GamePagination } from "@/components/games/GamePagination";
import { GameGridSkeleton } from "@/components/games/GameGridSkeleton";
import { SearchSkeleton } from "@/components/games/SearchSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Genre } from "@/types/genre";
import { GameSummary } from "@/types/game";
import { Pagination } from "@/types/pagination";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";
import { FaGamepad, FaClock, FaStar, FaPlus } from "react-icons/fa";
import Link from "next/link";

interface LibraryGamesContentProps {
  locale?: string;
}

interface LibraryStats {
  totalGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating?: number;
}

export function LibraryGamesContent({ locale = "fr" }: LibraryGamesContentProps) {
  // State management
  const [games, setGames] = useState<GameSummary[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    totalGames: 0,
    completedGames: 0,
    totalPlayTime: 0,
  });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const apiClient = useApiClient();
  const { executeAsync } = useAsyncError();

  // Fetch library statistics
  const fetchStats = useCallback(async () => {
    const result = await executeAsync(async () => {
      const data = await apiClient.get("/api/library/stats", {
        retryConfig: {
          maxAttempts: 2,
        },
      });

      return data;
    }, "fetchLibraryStats");

    if (result) {
      setStats(result);
    }
  }, [apiClient, executeAsync]);

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    const result = await executeAsync(async () => {
      const data = await apiClient.get(`/api/genres?locale=${locale}`, {
        retryConfig: {
          maxAttempts: 2,
        },
      });

      return data.genres || [];
    }, "fetchGenres");

    if (result) {
      setGenres(result);
    }
  }, [locale, apiClient, executeAsync]);

  // Fetch library games with filters
  const fetchLibraryGames = useCallback(
    async (
      search: string = "",
      genres: string[] = [],
      publishers: string[] = [],
      page: number = 1
    ) => {
      setLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          locale,
          page: page.toString(),
          limit: "20",
          inLibrary: "true",
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
      }, "fetchLibraryGames");

      if (result) {
        setGames(result.games);
        setPagination(result.pagination);
      } else {
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les jeux. Les données précédentes sont conservées.",
        });
      }

      setLoading(false);
      setInitialLoading(false);
    },
    [locale, apiClient, executeAsync]
  );

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle genre filter
  const handleGenreFilter = useCallback((genres: string[]) => {
    setSelectedGenres(genres);
  }, []);

  // Handle publisher filter
  const handlePublisherFilter = useCallback((publishers: string[]) => {
    setSelectedPublishers(publishers);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchLibraryGames(searchQuery, selectedGenres, selectedPublishers, page);
    },
    [fetchLibraryGames, searchQuery, selectedGenres, selectedPublishers]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGenres([]);
    setSelectedPublishers([]);
  }, []);

  // Handle game removal from library
  const handleGameRemoved = useCallback(
    (gameId: string) => {
      setGames((prevGames) => prevGames.filter((game) => game.id !== gameId));
      setStats((prevStats) => ({
        ...prevStats,
        totalGames: Math.max(0, prevStats.totalGames - 1),
      }));
      if (pagination) {
        setPagination({
          ...pagination,
          totalCount: Math.max(0, pagination.totalCount - 1),
        });
      }
    },
    [pagination]
  );

  // Initial load
  useEffect(() => {
    fetchGenres();
    fetchStats();

    const loadInitialGames = async () => {
      setLoading(true);
      setInitialLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          locale,
          page: "1",
          limit: "20",
          inLibrary: "true",
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
      }, "fetchLibraryGames");

      if (result) {
        setGames(result.games);
        setPagination(result.pagination);
      }

      setLoading(false);
      setInitialLoading(false);
    };

    loadInitialGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect for filter changes with debounce
  useEffect(() => {
    if (initialLoading) return;

    const timeoutId = setTimeout(() => {
      fetchLibraryGames(searchQuery, selectedGenres, selectedPublishers, 1);
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedGenres, selectedPublishers]);

  // Show full skeleton on initial load
  if (initialLoading) {
    return <SearchSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl xl:text-5xl">
              Ma Bibliothèque
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                de Jeux
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-indigo-100/90 sm:text-lg">
              Gérez et explorez votre collection personnelle
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -left-2 top-1/3 h-16 w-16 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -right-4 top-2/3 h-20 w-20 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute -top-4 left-1/4 h-12 w-12 rounded-full bg-yellow-400/10 blur-lg"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-4">
          <Card className="rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="rounded-lg bg-blue-100 p-2">
                  <FaGamepad className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                </div>
                <div className="ml-3">
                  <CardTitle className="text-sm font-medium text-gray-900">Jeux possédés</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.totalGames}</div>
              <p className="text-xs text-gray-500">Dans votre bibliothèque</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="rounded-lg bg-green-100 p-2">
                  <FaGamepad className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                </div>
                <div className="ml-3">
                  <CardTitle className="text-sm font-medium text-gray-900">Jeux terminés</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-900 sm:text-2xl">
                {stats.completedGames}
              </div>
              <p className="text-xs text-gray-500">Complétés à 100%</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="rounded-lg bg-purple-100 p-2">
                  <FaClock className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
                </div>
                <div className="ml-3">
                  <CardTitle className="text-sm font-medium text-gray-900">Temps de jeu</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-900 sm:text-2xl">
                {stats.totalPlayTime}h
              </div>
              <p className="text-xs text-gray-500">Total joué</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="rounded-lg bg-yellow-100 p-2">
                  <FaStar className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
                </div>
                <div className="ml-3">
                  <CardTitle className="text-sm font-medium text-gray-900">Note moyenne</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-900 sm:text-2xl">
                {stats.averageRating ? `${stats.averageRating}/5` : "—"}
              </div>
              <p className="text-xs text-gray-500">Vos évaluations</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row">
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

        {/* Loading state */}
        {loading && !initialLoading && <GameGridSkeleton count={20} />}

        {/* Games grid */}
        {!loading && (
          <>
            {games.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-4 sm:p-6">
                    <FaGamepad className="h-8 w-8 text-gray-400 sm:h-12 sm:w-12" />
                  </div>
                  <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
                    {searchQuery || selectedGenres.length > 0 || selectedPublishers.length > 0
                      ? "Aucun jeu trouvé"
                      : "Votre bibliothèque est vide"}
                  </h3>
                  <p className="mb-6 max-w-md text-sm text-gray-500 sm:text-base">
                    {searchQuery || selectedGenres.length > 0 || selectedPublishers.length > 0
                      ? "Essayez de modifier vos critères de recherche"
                      : "Commencez à construire votre collection en explorant notre catalogue de jeux"}
                  </p>
                  {searchQuery || selectedGenres.length > 0 || selectedPublishers.length > 0 ? (
                    <Button onClick={handleClearFilters} className="bg-blue-600 hover:bg-blue-700">
                      Effacer les filtres
                    </Button>
                  ) : (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/games">
                        <FaPlus className="mr-2 h-4 w-4" />
                        Explorer les jeux
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {games.map((game, index) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      locale={locale}
                      priority={index < 4}
                      onRemovedFromLibrary={handleGameRemoved}
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
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
