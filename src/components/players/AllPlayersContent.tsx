"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayerCard } from "./PlayerCard";
import { PlayerSearchBar } from "./PlayerSearchBar";
import { PlayerFilters } from "./PlayerFilters";
import { PlayerFilterButton } from "./PlayerFilterButton";
import { PlayerPagination } from "./PlayerPagination";
import { PlayerGridSkeleton } from "./PlayerGridSkeleton";
import { PlayerSummary, PlayerPagination as PlayerPaginationType } from "@/types/player";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";

interface AllPlayersContentProps {
  locale?: string;
}

export function AllPlayersContent({ locale = "fr" }: AllPlayersContentProps) {
  // State management
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [pagination, setPagination] = useState<PlayerPaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGameCounts, setSelectedGameCounts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Use error handling system
  const apiClient = useApiClient();
  const { executeAsync } = useAsyncError();

  // Translations
  const t = {
    title: locale === "fr" ? "Découvrez la Communauté" : "Discover the Community",
    titleHighlight: locale === "fr" ? "Game Universe" : "Game Universe",
    subtitle:
      locale === "fr"
        ? "Explorez les profils des joueurs et découvrez leurs collections"
        : "Explore player profiles and discover their collections",
    playersAvailable: locale === "fr" ? "joueurs disponibles" : "players available",
    resultsFor: locale === "fr" ? "résultat(s) pour" : "result(s) for",
    playersTotal: locale === "fr" ? "joueurs au total" : "players total",
    activeFilters: locale === "fr" ? "Filtres actifs" : "Active filters",
    noPlayersFound: locale === "fr" ? "Aucun joueur trouvé" : "No players found",
    noPlayersDescription:
      locale === "fr"
        ? "Essayez de modifier vos critères de recherche ou explorez d'autres catégories"
        : "Try modifying your search criteria or explore other categories",
    noPlayersAvailable:
      locale === "fr"
        ? "Aucun joueur disponible pour le moment"
        : "No players available at the moment",
    clearFilters: locale === "fr" ? "Effacer les filtres" : "Clear filters",
    loadingError: locale === "fr" ? "Erreur de chargement" : "Loading error",
    loadingErrorDescription:
      locale === "fr"
        ? "Impossible de charger les joueurs. Les données précédentes sont conservées."
        : "Unable to load players. Previous data is preserved.",
  };

  // Fetch players with error handling
  const fetchPlayers = useCallback(
    async (search: string = "", gameCounts: string[] = [], page: number = 1) => {
      console.log("👥 fetchPlayers called with:", { search, gameCounts, page });
      setLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        // Handle multiple game count ranges by making separate requests or using the first one
        // For simplicity, we'll use the first selected range
        if (gameCounts.length > 0) {
          params.append("gameCountRange", gameCounts[0]);
        }

        const data = await apiClient.get(`/api/players?${params.toString()}`, {
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
          },
        });

        return {
          players: data.players || [],
          pagination: data.pagination || null,
        };
      }, "fetchPlayers");

      if (result) {
        setPlayers(result.players);
        setPagination(result.pagination);
      } else {
        // On error, keep previous data but show toast
        toast({
          variant: "destructive",
          title: t.loadingError,
          description: t.loadingErrorDescription,
        });
      }

      setLoading(false);
      setInitialLoading(false);
    },
    [apiClient, executeAsync, t.loadingError, t.loadingErrorDescription]
  );

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle game count filter
  const handleGameCountFilter = useCallback((counts: string[]) => {
    setSelectedGameCounts(counts);
  }, []);

  // Handle page change - scroll to top as per Requirements 2.4
  const handlePageChange = useCallback(
    (page: number) => {
      fetchPlayers(searchQuery, selectedGameCounts, page);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchPlayers, searchQuery, selectedGameCounts]
  );

  // Clear all filters - Requirements 4.3
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGameCounts([]);
  }, []);

  // Initial load - only on mount
  useEffect(() => {
    const loadInitialPlayers = async () => {
      setLoading(true);
      setInitialLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          page: "1",
          limit: "20",
        });

        const data = await apiClient.get(`/api/players?${params.toString()}`, {
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
          },
        });

        return {
          players: data.players || [],
          pagination: data.pagination || null,
        };
      }, "fetchPlayers");

      if (result) {
        setPlayers(result.players);
        setPagination(result.pagination);
      }

      setLoading(false);
      setInitialLoading(false);
    };

    loadInitialPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on initial mount

  // Effect to handle filter changes with debounce - Requirements 3.4
  useEffect(() => {
    // Don't execute during initial loading
    if (initialLoading) return;

    const timeoutId = setTimeout(() => {
      fetchPlayers(searchQuery, selectedGameCounts, 1);
    }, 300); // 300ms debounce as per Requirements 3.4

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedGameCounts]); // Don't include fetchPlayers

  // Show full skeleton on initial load - Requirements 1.3
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <PlayerGridSkeleton count={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl xl:text-5xl">
              {t.title}
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-indigo-100/90 sm:text-lg">{t.subtitle}</p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -left-2 top-1/3 h-16 w-16 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -right-4 top-2/3 h-20 w-20 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute -top-4 left-1/4 h-12 w-12 rounded-full bg-yellow-400/10 blur-lg"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Search and Filters - Requirements 3.1, 4.1 */}
        <div className="mb-6 space-y-4 sm:mb-8">
          {/* Search bar with filter button - responsive layout */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <PlayerSearchBar onSearch={handleSearch} initialValue={searchQuery} />
            </div>
            <div className="flex-shrink-0">
              <PlayerFilterButton
                hasFilters={selectedGameCounts.length > 0}
                filterCount={selectedGameCounts.length}
                onClick={() => setShowFilters(!showFilters)}
                locale={locale}
              />
            </div>
          </div>

          {/* Filter content below - full width */}
          <PlayerFilters
            selectedGameCounts={selectedGameCounts}
            onGameCountChange={handleGameCountFilter}
            onClearFilters={handleClearFilters}
            showAllFilters={showFilters}
            locale={locale}
          />
        </div>

        {/* Results info */}
        {pagination && (
          <div className="mb-4 flex flex-col items-start justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:mb-6 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              {searchQuery ? (
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-blue-600">{pagination.totalCount}</span> {t.resultsFor} "
                  {searchQuery}"
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-blue-600">{pagination.totalCount}</span> {t.playersTotal}
                </p>
              )}
            </div>
            {selectedGameCounts.length > 0 && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500 sm:mt-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>{t.activeFilters}</span>
              </div>
            )}
          </div>
        )}

        {/* Loading state - Show skeleton grid */}
        {loading && !initialLoading && <PlayerGridSkeleton count={20} />}

        {/* Players grid - Requirements 1.1, 1.2 */}
        {!loading && (
          <>
            {players.length === 0 ? (
              // Empty state - Requirements 1.4
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm sm:py-20">
                <div className="mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-6">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
                  {t.noPlayersFound}
                </h3>
                <p className="max-w-md text-sm text-gray-500 sm:text-base">
                  {searchQuery || selectedGameCounts.length > 0
                    ? t.noPlayersDescription
                    : t.noPlayersAvailable}
                </p>
                {(searchQuery || selectedGameCounts.length > 0) && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Responsive grid - Requirements 7.1 */}
                <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {players.map((player, index) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      locale={locale}
                      priority={index < 4} // Priority loading for first 4 cards
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination - Requirements 2.1, 2.2, 2.3 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 sm:mt-12">
                <PlayerPagination
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
