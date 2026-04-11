"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { EntityCard } from "@/components/shared/EntityCard";
import { gameCardConfig } from "@/components/shared/entityCardPresets";
import { FilterButton } from "@/components/shared/FilterButton";
import { SearchSkeleton } from "./SearchSkeleton";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { useGameListing, useGenres, usePlatforms } from "@/hooks/useGameListing";

// Lazy load des composants non visibles au premier rendu
const GameFilters = dynamic(() => import("./GameFilters").then((m) => m.GameFilters));
const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);
const GamesEmptyState = dynamic(() => import("./GamesEmptyState").then((m) => m.GamesEmptyState));

interface AllGamesContentProps {
  locale?: string;
}

export function AllGamesContent({ locale = "fr" }: AllGamesContentProps) {
  const t = useTranslations("navigation");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // SWR hooks — cache automatique, stale-while-revalidate, déduplication
  const { genres } = useGenres(locale);
  const { platforms } = usePlatforms(locale);
  const { games, pagination, loading, validating } = useGameListing(
    locale,
    currentPage,
    selectedGenres,
    selectedPlatforms
  );

  // Le premier chargement est quand SWR n'a encore aucune donnée
  const initialLoading = loading && games.length === 0;
  // Transition : SWR revalide (changement de filtre/page) mais a des données précédentes
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

  const handlePageChange = useCallback((page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(page);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
    setSelectedPublishers([]);
    setSelectedPlatforms([]);
    setCurrentPage(1);
  }, []);

  const hasFilters =
    selectedGenres.length > 0 || selectedPublishers.length > 0 || selectedPlatforms.length > 0;

  // Skeleton complet au premier chargement
  if (initialLoading) {
    return <SearchSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <FilterButton
            hasFilters={hasFilters}
            filterCount={selectedGenres.length + selectedPlatforms.length}
            onClick={() => setShowFilters(!showFilters)}
          />

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

        {/* Contenu avec transition d'opacité pendant la revalidation */}
        <div
          className={`transition-opacity duration-300 ${transitioning ? "opacity-50" : "opacity-100"}`}
        >
          {games.length === 0 && !validating ? (
            <GamesEmptyState hasFilters={hasFilters} onClearFilters={handleClearFilters} />
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
