"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PlayerCard } from "./PlayerCard";
import { PlayerSearchBar } from "./PlayerSearchBar";
import { PlayerFilters } from "./PlayerFilters";
import { PlayerFilterButton } from "./PlayerFilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { playerSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { PlayerSummary, PlayerPagination as PlayerPaginationType } from "@/types/player";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";

interface AllPlayersContentProps {
  locale?: string;
}

export function AllPlayersContent({ locale = "fr" }: AllPlayersContentProps) {
  const t = useTranslations("players");
  const tErrors = useTranslations("errors");
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

  // Fetch players with error handling
  const fetchPlayers = useCallback(
    async (search: string = "", gameCounts: string[] = [], page: number = 1) => {
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
          title: tErrors("loadingError"),
          description: tErrors("loadingErrorDescription"),
        });
      }

      setLoading(false);
      setInitialLoading(false);
    },
    [apiClient, executeAsync, tErrors]
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
  }, []); // Only on initial mount

  // Effect to handle filter changes with debounce - Requirements 3.4
  useEffect(() => {
    // Don't execute during initial loading
    if (initialLoading) return;

    const timeoutId = setTimeout(() => {
      fetchPlayers(searchQuery, selectedGameCounts, 1);
    }, 300); // 300ms debounce as per Requirements 3.4

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGameCounts, fetchPlayers]); // Include fetchPlayers

  // Show full skeleton on initial load - Requirements 1.3
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <GridSkeleton skeletonConfig={playerSkeletonConfig} count={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
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

        {/* Loading state - Show skeleton grid */}
        {loading && !initialLoading && (
          <GridSkeleton skeletonConfig={playerSkeletonConfig} count={20} />
        )}

        {/* Players grid - Requirements 1.1, 1.2 */}
        {!loading && (
          <>
            {players.length === 0 ? (
              // Empty state - Requirements 1.4
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm dark:bg-gray-800 sm:py-20">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  {t("empty.title")}
                </h3>
                <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                  {searchQuery || selectedGameCounts.length > 0
                    ? t("empty.description")
                    : t("empty.noPlayers")}
                </p>
                {(searchQuery || selectedGameCounts.length > 0) && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {t("empty.clearFilters")}
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
                      priority={index < 4}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination - Requirements 2.1, 2.2, 2.3 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 sm:mt-12">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                  loading={loading}
                  translationNamespace="players.pagination"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
