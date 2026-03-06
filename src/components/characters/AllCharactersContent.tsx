"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { EntityCard } from "@/components/shared/EntityCard";
import { characterCardConfig } from "@/components/shared/entityCardPresets";
import { CharacterFilters } from "./CharacterFilters";
import { CharacterFilterButton } from "./CharacterFilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { CharacterSummary } from "@/types/character";
import { Pagination as PaginationType } from "@/types/pagination";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";

interface Game {
  id: string;
  title: string;
  characterCount?: number;
}

interface AllCharactersContentProps {
  locale?: string;
}

export function AllCharactersContent({ locale = "fr" }: AllCharactersContentProps) {
  const t = useTranslations("characters");
  const tErrors = useTranslations("errors");
  // State management
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Use error handling system
  const apiClient = useApiClient();
  const { executeAsync } = useAsyncError();

  // Fetch games for filter options with error handling
  const fetchGames = useCallback(async () => {
    const result = await executeAsync(async () => {
      const data = await apiClient.get(`/api/games?locale=${locale}&limit=100`, {
        retryConfig: {
          maxAttempts: 2,
        },
      });

      return data.games || [];
    }, "fetchGames");

    if (result) {
      setGames(result);
    }
  }, [locale, apiClient, executeAsync]);

  // Fetch characters with error handling
  const fetchCharacters = useCallback(
    async (search: string = "", games: string[] = [], roles: string[] = [], page: number = 1) => {
      setLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          locale,
          page: page.toString(),
          limit: "20",
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (games.length > 0) {
          params.append("games", games.join(","));
        }

        if (roles.length > 0) {
          params.append("roles", roles.join(","));
        }

        const data = await apiClient.get(`/api/characters?${params.toString()}`, {
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
          },
        });

        return {
          characters: data.characters || [],
          pagination: data.pagination || null,
        };
      }, "fetchCharacters");

      if (result) {
        setCharacters(result.characters);
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
    [locale, apiClient, executeAsync]
  );

  // Handle search
  const _handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle game filter
  const handleGameFilter = useCallback((games: string[]) => {
    setSelectedGames(games);
  }, []);

  // Handle role filter
  const handleRoleFilter = useCallback((roles: string[]) => {
    setSelectedRoles(roles);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchCharacters(searchQuery, selectedGames, selectedRoles, page);
    },
    [fetchCharacters, searchQuery, selectedGames, selectedRoles]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGames([]);
    setSelectedRoles([]);
  }, []);

  // Initial load - only on mount
  useEffect(() => {
    fetchGames();

    // Direct call without depending on fetchCharacters
    const loadInitialCharacters = async () => {
      setLoading(true);
      setInitialLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({
          locale,
          page: "1",
          limit: "20",
        });

        const data = await apiClient.get(`/api/characters?${params.toString()}`, {
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
          },
        });

        return {
          characters: data.characters || [],
          pagination: data.pagination || null,
        };
      }, "fetchCharacters");

      if (result) {
        setCharacters(result.characters);
        setPagination(result.pagination);
      }

      setLoading(false);
      setInitialLoading(false);
    };

    loadInitialCharacters();
  }, []); // Only on initial mount

  // Effect to handle filter changes with debounce
  useEffect(() => {
    // Don't execute during initial loading
    if (initialLoading) return;

    const timeoutId = setTimeout(() => {
      fetchCharacters(searchQuery, selectedGames, selectedRoles, 1);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGames, selectedRoles, fetchCharacters]); // Include fetchCharacters

  // Show full skeleton on initial load
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <GridSkeleton skeletonConfig={characterSkeletonConfig} count={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <CharacterFilterButton
            hasFilters={selectedGames.length > 0 || selectedRoles.length > 0}
            filterCount={selectedGames.length + selectedRoles.length}
            onClick={() => setShowFilters(!showFilters)}
          />

          {/* Filter content below - full width */}
          <CharacterFilters
            games={games}
            selectedGames={selectedGames}
            selectedRoles={selectedRoles}
            onGameChange={handleGameFilter}
            onRoleChange={handleRoleFilter}
            onClearFilters={handleClearFilters}
            showAllFilters={showFilters}
          />
        </div>

        {/* Loading state - Show skeleton grid */}
        {loading && !initialLoading && (
          <GridSkeleton skeletonConfig={characterSkeletonConfig} count={20} />
        )}

        {/* Characters grid */}
        {!loading && (
          <>
            {characters.length === 0 ? (
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  {t("empty.title")}
                </h3>
                <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                  {searchQuery || selectedGames.length > 0 || selectedRoles.length > 0
                    ? t("empty.description")
                    : t("empty.noCharacters")}
                </p>
                {(searchQuery || selectedGames.length > 0 || selectedRoles.length > 0) && (
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
                {/* Responsive grid - 4 columns layout */}
                <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {characters.map((character, index) => (
                    <EntityCard
                      key={character.id}
                      entity={character}
                      config={characterCardConfig}
                      locale={locale}
                      priority={index < 4} // Priority loading for first 4 cards
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
                  translationNamespace="characters.pagination"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
