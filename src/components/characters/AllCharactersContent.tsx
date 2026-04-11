"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { EntityCard } from "@/components/shared/EntityCard";
import { characterCardConfig } from "@/components/shared/entityCardPresets";
import { CharacterFilters } from "./CharacterFilters";
import { CharactersEmptyState } from "./CharactersEmptyState";
import { FilterButton } from "@/components/shared/FilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { CharacterSummary } from "@/types/character";
import { Pagination as PaginationType } from "@/types/pagination";
import { CharacterFavoriteStatusProvider } from "@/components/providers/CharacterFavoriteStatusProvider";
import { useCharacters } from "@/hooks/useCharacters";
import { useCharacterFilters } from "@/hooks/useCharacterFilters";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface AllCharactersContentProps {
  locale?: string;
  initialCharacters?: CharacterSummary[];
  initialPagination?: PaginationType | null;
}

export function AllCharactersContent({
  locale = "fr",
  initialCharacters,
  initialPagination,
}: AllCharactersContentProps) {
  const t = useTranslations("navigation");
  // --- État local des filtres ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // --- Données SSR comme fallback SWR (page 1, pas de filtres) ---
  const isDefaultView =
    !debouncedSearch &&
    selectedRoles.length === 0 &&
    selectedPlatforms.length === 0 &&
    currentPage === 1;
  const fallbackData =
    isDefaultView && initialCharacters
      ? { characters: initialCharacters, pagination: initialPagination as PaginationType }
      : undefined;

  // --- Hook SWR : personnages ---
  const { characters, pagination, isLoading, isValidating } = useCharacters(
    {
      locale,
      search: debouncedSearch,
      roles: selectedRoles,
      platforms: selectedPlatforms,
      page: currentPage,
    },
    fallbackData
  );

  // --- Hook SWR : filtres (rôles + plateformes) ---
  const { roles, platforms } = useCharacterFilters(locale);

  // --- Handlers ---
  const handleRoleFilter = useCallback((roles: string[]) => {
    setSelectedRoles(roles);
    setCurrentPage(1);
  }, []);

  const handlePlatformFilter = useCallback((platforms: string[]) => {
    setSelectedPlatforms(platforms);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedRoles([]);
    setSelectedPlatforms([]);
    setCurrentPage(1);
  }, []);

  // Slugs mémoïsés pour le batch fetch des favoris (évite re-render du provider)
  const characterSlugs = useMemo(() => characters.map((c) => c.slug), [characters]);

  // Premier chargement sans données SSR
  const initialLoading = isLoading && characters.length === 0;

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

        {/* Characters grid — semi-transparent pendant la revalidation pour éviter le layout shift */}
        <CharacterFavoriteStatusProvider slugs={characterSlugs}>
          <div
            className={`transition-opacity duration-200 ${isValidating && !isLoading ? "pointer-events-none opacity-40" : ""}`}
          >
            {characters.length === 0 && !isLoading ? (
              <CharactersEmptyState
                hasFilters={
                  !!searchQuery || selectedRoles.length > 0 || selectedPlatforms.length > 0
                }
                onClearFilters={handleClearFilters}
              />
            ) : characters.length > 0 ? (
              <div className="space-y-8">
                <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {characters.map((character, index) => (
                    <EntityCard
                      key={character.id}
                      entity={character}
                      config={characterCardConfig}
                      locale={locale}
                      priority={index < 4}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </CharacterFavoriteStatusProvider>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 sm:mt-12">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={setCurrentPage}
              loading={isValidating}
              translationNamespace="characters.pagination"
            />
          </div>
        )}
      </div>
    </div>
  );
}
