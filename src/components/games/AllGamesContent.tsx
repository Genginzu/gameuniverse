"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { EntityCard } from "@/components/shared/EntityCard";
import { gameCardConfig } from "@/components/shared/entityCardPresets";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterButton } from "@/components/shared/FilterButton";
import { GameSortMenu } from "./GameSortMenu";
import { SearchSkeleton } from "./SearchSkeleton";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { useGameListing, useGenres, usePlatforms, GamesApiResponse } from "@/hooks/useGameListing";
import { DEFAULT_GAME_LISTING_SORT, GameListingSort, GameSummary } from "@/types/game";
import { Pagination as PaginationType } from "@/types/pagination";

const GameFilters = dynamic(() => import("./GameFilters").then((m) => m.GameFilters));
const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);

interface AllGamesContentProps {
  locale?: string;
  initialGames?: GameSummary[];
  initialPagination?: PaginationType | null;
}

export function AllGamesContent({
  locale = "fr",
  initialGames,
  initialPagination,
}: AllGamesContentProps) {
  const t = useTranslations("games");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [esportFilter, setEsportFilter] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<GameListingSort>(DEFAULT_GAME_LISTING_SORT);

  // Données SSR comme fallback SWR (page 1, pas de filtres, tri par défaut)
  const isDefaultView =
    currentPage === 1 &&
    selectedGenres.length === 0 &&
    selectedPlatforms.length === 0 &&
    esportFilter === null &&
    sort === DEFAULT_GAME_LISTING_SORT;

  const fallbackData: GamesApiResponse | undefined =
    isDefaultView && initialGames && initialPagination
      ? { games: initialGames, pagination: initialPagination }
      : undefined;

  // SWR hooks
  const { genres } = useGenres(locale);
  const { platforms } = usePlatforms(locale);
  const { games, pagination, loading, validating } = useGameListing(
    locale,
    currentPage,
    selectedGenres,
    selectedPlatforms,
    sort,
    esportFilter,
    fallbackData
  );

  const initialLoading = loading && games.length === 0;
  const transitioning = validating && !loading;

  const handleGenreFilter = useCallback((genres: string[]) => {
    setSelectedGenres(genres);
    setCurrentPage(1);
  }, []);

  const handlePublisherFilter = useCallback((publishers: string[]) => {
    setSelectedPublishers(publishers);
  }, []);

  const handlePlatformFilter = useCallback((platforms: string[]) => {
    setSelectedPlatforms(platforms);
    setCurrentPage(1);
  }, []);

  const handleEsportFilter = useCallback((value: boolean | null) => {
    setEsportFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((next: GameListingSort) => {
    setSort(next);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(page);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
    setSelectedPublishers([]);
    setSelectedPlatforms([]);
    setEsportFilter(null);
    setCurrentPage(1);
  }, []);

  const hasFilters =
    selectedGenres.length > 0 ||
    selectedPublishers.length > 0 ||
    selectedPlatforms.length > 0 ||
    esportFilter !== null;

  if (initialLoading) {
    return <SearchSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <FilterButton
              hasFilters={hasFilters}
              filterCount={
                selectedGenres.length + selectedPlatforms.length + (esportFilter !== null ? 1 : 0)
              }
              onClick={() => setShowFilters(!showFilters)}
            />
            <GameSortMenu value={sort} onChange={handleSortChange} />
          </div>

          <GameFilters
            genres={genres}
            platforms={platforms}
            selectedGenres={selectedGenres}
            selectedPublishers={selectedPublishers}
            selectedPlatforms={selectedPlatforms}
            esportFilter={esportFilter}
            onGenreChange={handleGenreFilter}
            onPublisherChange={handlePublisherFilter}
            onPlatformsChange={handlePlatformFilter}
            onEsportChange={handleEsportFilter}
            onClearFilters={handleClearFilters}
            showAllGenres={showFilters}
          />
        </div>

        {/* Contenu avec transition d'opacité pendant la revalidation */}
        <div
          className={`transition-opacity duration-300 ${transitioning ? "opacity-50" : "opacity-100"}`}
        >
          {games.length === 0 && !validating ? (
            <EmptyState
              icon="lucide:gamepad-2"
              title={t("noGamesFound")}
              description={hasFilters ? t("modifySearch") : t("noGamesAvailable")}
              action={
                hasFilters ? { label: t("clearFilters"), onClick: handleClearFilters } : undefined
              }
            />
          ) : (
            <div className="space-y-8">
              <LibraryStatusProvider gameIds={games.map((g) => g.id)}>
                <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {games.map((game, index) => (
                    <EntityCard
                      key={game.id}
                      entity={game}
                      config={gameCardConfig}
                      locale={locale}
                      priority={index < 4}
                    />
                  ))}
                </div>
              </LibraryStatusProvider>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 sm:mt-12">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={handlePageChange}
                loading={validating}
                translationNamespace="pagination"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
