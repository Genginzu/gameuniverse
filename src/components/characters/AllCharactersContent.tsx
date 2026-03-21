"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { EntityCard } from "@/components/shared/EntityCard";
import { characterCardConfig } from "@/components/shared/entityCardPresets";
import { CharacterFilters, type RoleFilterOption } from "./CharacterFilters";
import { CharactersEmptyState } from "./CharactersEmptyState";
import { FilterButton } from "@/components/shared/FilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { CharacterSummary } from "@/types/character";
import { PlatformFilterOption } from "@/types/platform";
import { Pagination as PaginationType } from "@/types/pagination";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";

interface AllCharactersContentProps {
  locale?: string;
}

export function AllCharactersContent({ locale = "fr" }: AllCharactersContentProps) {
  const tErrors = useTranslations("errors");
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformFilterOption[]>([]);
  const [roles, setRoles] = useState<RoleFilterOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const apiClient = useApiClient();
  const { executeAsync } = useAsyncError();

  const fetchCharacters = useCallback(
    async (
      search: string = "",
      roles: string[] = [],
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

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (roles.length > 0) {
          params.append("roles", roles.join(","));
        }

        if (platforms.length > 0) {
          params.append("platforms", platforms.join(","));
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

  // Handle role filter
  const handleRoleFilter = useCallback((roles: string[]) => {
    setSelectedRoles(roles);
  }, []);

  // Handle platform filter
  const handlePlatformFilter = useCallback((platforms: string[]) => {
    setSelectedPlatforms(platforms);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchCharacters(searchQuery, selectedRoles, page, selectedPlatforms);
    },
    [fetchCharacters, searchQuery, selectedRoles, selectedPlatforms]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedRoles([]);
    setSelectedPlatforms([]);
  }, []);

  // Fetch platforms for filter panel
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

  // Fetch roles for filter panel
  const fetchRoles = useCallback(async () => {
    const result = await executeAsync(async () => {
      const data = await apiClient.get(`/api/roles?locale=${locale}`, {
        retryConfig: { maxAttempts: 2 },
      });
      return data.roles || [];
    }, "fetchRoles");

    if (result) {
      setRoles(result);
    }
  }, [locale, apiClient, executeAsync]);

  // Initial load - only on mount
  useEffect(() => {
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
    fetchPlatforms();
    fetchRoles();
  }, []); // Only on initial mount

  // Effect to handle filter changes with debounce
  useEffect(() => {
    // Don't execute during initial loading
    if (initialLoading) return;

    const timeoutId = setTimeout(() => {
      fetchCharacters(searchQuery, selectedRoles, 1, selectedPlatforms);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedRoles, selectedPlatforms, fetchCharacters]); // Include fetchCharacters

  // Show full skeleton on initial load
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <GridSkeleton skeletonConfig={characterSkeletonConfig} count={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <FilterButton
            hasFilters={selectedRoles.length > 0 || selectedPlatforms.length > 0}
            filterCount={selectedRoles.length + selectedPlatforms.length}
            onClick={() => setShowFilters(!showFilters)}
          />

          {/* Filter content below - full width */}
          <CharacterFilters
            selectedRoles={selectedRoles}
            selectedPlatforms={selectedPlatforms}
            roles={roles}
            platforms={platforms}
            onRoleChange={handleRoleFilter}
            onPlatformsChange={handlePlatformFilter}
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
              <CharactersEmptyState
                hasFilters={
                  !!searchQuery || selectedRoles.length > 0 || selectedPlatforms.length > 0
                }
                onClearFilters={handleClearFilters}
              />
            ) : (
              <div className="space-y-8">
                {/* Responsive grid - 4 columns layout */}
                <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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
