"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CharacterCard } from "./CharacterCard";
import { CharacterSearchBar } from "./CharacterSearchBar";
import { CharacterFilters } from "./CharacterFilters";
import { CharacterFilterButton } from "./CharacterFilterButton";
import { CharacterPagination } from "./CharacterPagination";
import { CharacterGridSkeleton } from "./CharacterGridSkeleton";
import { CharacterSummary } from "@/types/character";
import { Pagination } from "@/types/pagination";
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
  const [pagination, setPagination] = useState<Pagination | null>(null);
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
  const handleSearch = useCallback((query: string) => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <CharacterGridSkeleton count={20} />
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
              {t("heroTitle")}
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t("heroTitleHighlight")}
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-indigo-100/90 sm:text-lg">
              {t("heroSubtitle")}
            </p>
          </div>
        </div>

        {/* Decorative elements */}
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
              <CharacterSearchBar onSearch={handleSearch} initialValue={searchQuery} />
            </div>
            <div className="flex-shrink-0">
              <CharacterFilterButton
                hasFilters={selectedGames.length > 0 || selectedRoles.length > 0}
                filterCount={selectedGames.length + selectedRoles.length}
                onClick={() => setShowFilters(!showFilters)}
              />
            </div>
          </div>

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
        {loading && !initialLoading && <CharacterGridSkeleton count={20} />}

        {/* Characters grid */}
        {!loading && (
          <>
            {characters.length === 0 ? (
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
                  {t("empty.title")}
                </h3>
                <p className="max-w-md text-sm text-gray-500 sm:text-base">
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
                    <CharacterCard
                      key={character.id}
                      character={character}
                      locale={locale}
                      priority={index < 4} // Priority loading for first 4 cards
                    />
                  ))}
                </div>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 sm:mt-12">
                <CharacterPagination
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
