"use client";

/**
 * AllCharactersContent : page Personnages (`/characters`) au look éditorial.
 *
 * Conserve la logique métier (SWR `useCharacters` + filtres + pagination,
 * ISR fallbackData, provider de favoris). Style : Tailwind inline + tokens
 * éditoriaux, grille d'`EntityCard` (config éditoriale), filtres en variante
 * `editorial`, skeleton éditorial.
 */

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Button } from "@/components/ui/button";
import { EntityCard, type EntityCardConfig } from "@/components/shared/EntityCard";
import { CharacterFilters } from "./CharacterFilters";
import { FilterButton } from "@/components/shared/FilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { characterSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { CharacterFavoriteStatusProvider } from "@/components/providers/CharacterFavoriteStatusProvider";
import { useCharacters } from "@/hooks/useCharacters";
import { useCharacterFilters } from "@/hooks/useCharacterFilters";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { CharacterSummary } from "@/types/character";
import type { Pagination as PaginationType } from "@/types/pagination";

interface AllCharactersContentProps {
  locale?: string;
  initialCharacters?: CharacterSummary[];
  initialPagination?: PaginationType | null;
}

const GRID =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6";

/** Config éditoriale de la carte personnage (cover 3/4, overlay sombre au hover). */
const editorialCardConfig: EntityCardConfig<CharacterSummary> = {
  aspectRatio: "3:4",
  imageField: "mainImage",
  titleField: "name",
  backgroundColorField: "backgroundColor",
  idField: "id",
  translationNamespace: "characters.card",
  badge: { field: "role", position: "top-right", variant: "role" },
  hoverOverlay: { enabled: true, showTitle: true, showDescription: false, fields: [] },
  actions: {},
  linkTemplate: (character) => `/characters/${character.slug}`,
  customHoverRenderer: (character, t) => (
    <>
      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{character.name}</h3>
      {character.primaryGame && (
        <div className="flex items-center text-xs text-gray-300">
          <span className="text-gray-400">{t("game")}</span>
          <span className="ml-1 font-medium text-white">{character.primaryGame}</span>
        </div>
      )}
    </>
  ),
};

export function AllCharactersContent({
  locale = "fr",
  initialCharacters,
  initialPagination,
}: AllCharactersContentProps) {
  const t = useTranslations("characters");

  const [searchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const isDefaultView =
    !debouncedSearch &&
    selectedRoles.length === 0 &&
    selectedPlatforms.length === 0 &&
    currentPage === 1;
  const fallbackData =
    isDefaultView && initialCharacters
      ? { characters: initialCharacters, pagination: initialPagination as PaginationType }
      : undefined;

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

  const { roles, platforms } = useCharacterFilters(locale);

  const handleRoleFilter = useCallback((next: string[]) => {
    setSelectedRoles(next);
    setCurrentPage(1);
  }, []);

  const handlePlatformFilter = useCallback((next: string[]) => {
    setSelectedPlatforms(next);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedRoles([]);
    setSelectedPlatforms([]);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(page);
  }, []);

  const characterSlugs = useMemo(() => characters.map((c) => c.slug), [characters]);

  const initialLoading = isLoading && characters.length === 0;
  const hasFilters = selectedRoles.length > 0 || selectedPlatforms.length > 0;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        {/* Hero */}
        <header className="mb-10 flex flex-col gap-3">
          <KickerLabel>{t("title")}</KickerLabel>
          <h1 className="font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t("heroTitle")} <span className="text-editorial-accent">{t("heroTitleHighlight")}</span>
          </h1>
          <p className="text-editorial-muted flex flex-wrap items-baseline gap-5 text-sm">
            <span>{t("heroSubtitle")}</span>
            {pagination && (
              <>
                <span>·</span>
                <span className="text-editorial-accent font-mono">
                  {t("availableCount", { count: pagination.totalCount })}
                </span>
              </>
            )}
          </p>
        </header>

        {/* Contrôles + filtres */}
        <div className="mb-6 space-y-4">
          <FilterButton
            hasFilters={hasFilters}
            filterCount={selectedRoles.length + selectedPlatforms.length}
            onClick={() => setShowFilters((v) => !v)}
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
            variant="editorial"
          />
        </div>

        {/* Grille / états */}
        {initialLoading ? (
          <GridSkeleton skeletonConfig={characterSkeletonConfig} count={20} gridClassName={GRID} />
        ) : characters.length === 0 ? (
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
            <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
              <Icon icon="lucide:user" className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{t("empty.title")}</h3>
            <p className="text-editorial-muted max-w-[50ch]">
              {hasFilters ? t("empty.description") : t("empty.noCharacters")}
            </p>
            {hasFilters && (
              <Button onClick={handleClearFilters}>{t("empty.clearFilters")}</Button>
            )}
          </div>
        ) : (
          <CharacterFavoriteStatusProvider slugs={characterSlugs}>
            <div
              className="transition-opacity duration-200 data-[revalidating=true]:opacity-50"
              data-revalidating={isValidating && !isLoading ? "true" : "false"}
            >
              <div className={GRID}>
                {characters.map((character, index) => (
                  <EntityCard
                    key={character.id}
                    entity={character}
                    config={editorialCardConfig}
                    locale={locale}
                    priority={index < 6}
                  />
                ))}
              </div>
            </div>
          </CharacterFavoriteStatusProvider>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={handlePageChange}
              loading={isValidating}
              translationNamespace="characters.pagination"
              variant="editorial"
            />
          </div>
        )}
      </div>
    </section>
  );
}
