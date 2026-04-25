"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { EntityCard } from "@/components/shared/EntityCard";
import { gameCardConfig } from "@/components/shared/entityCardPresets";
import { GameSearchBar } from "@/components/games/GameSearchBar";
import { FilterButton } from "@/components/shared/FilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { LibraryPageSkeleton } from "./LibraryPageSkeleton";
import { LibraryStatsCards } from "./LibraryStatsCards";
import { Button } from "@/components/ui/button";
import { useLibraryGames } from "@/hooks/useLibraryGames";

import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";

// Lazy load — visible uniquement après clic sur le bouton filtre
const GameFilters = dynamic(() =>
  import("@/components/games/GameFilters").then((m) => m.GameFilters)
);

interface LibraryGamesContentProps {
  locale?: string;
}

export function LibraryGamesContent({ locale = "fr" }: LibraryGamesContentProps) {
  const [showFilters, setShowFilters] = useState(false);
  const t = useTranslations("userLibrary");

  const {
    games,
    stats,
    genres,
    pagination,
    initialLoading,
    loading,
    searchQuery,
    selectedGenres,
    selectedPublishers,
    hasActiveFilters,
    handleSearch,
    handleGenreFilter,
    handlePublisherFilter,
    handlePageChange,
    handleClearFilters,
    handleGameRemoved,
  } = useLibraryGames(locale);

  if (initialLoading) {
    return <LibraryPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>

        <LibraryStatsCards stats={stats} />

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <GameSearchBar onSearch={handleSearch} initialValue={searchQuery} />
            </div>
            <div className="shrink-0">
              <FilterButton
                hasFilters={selectedGenres.length > 0 || selectedPublishers.length > 0}
                filterCount={selectedGenres.length}
                onClick={() => setShowFilters(!showFilters)}
              />
            </div>
          </div>

          <GameFilters
            genres={genres}
            platforms={[]}
            selectedGenres={selectedGenres}
            selectedPublishers={selectedPublishers}
            selectedPlatforms={[]}
            onGenreChange={handleGenreFilter}
            onPublisherChange={handlePublisherFilter}
            onPlatformsChange={() => {}}
            onClearFilters={handleClearFilters}
            showAllGenres={showFilters}
          />
        </div>

        {/* Loading state lors d'un changement de filtre/page */}
        {loading && !initialLoading && (
          <GridSkeleton skeletonConfig={gameSkeletonConfig} count={20} />
        )}

        {/* Games grid */}
        {!loading && (
          <>
            {games.length === 0 ? (
              <LibraryEmptyState
                hasFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <div className="space-y-8">
                <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {games.map((game, index) => (
                    <EntityCard
                      key={game.id}
                      entity={game}
                      config={gameCardConfig}
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
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                  loading={loading}
                  translationNamespace="pagination"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** État vide — bibliothèque vide ou aucun résultat de recherche */
function LibraryEmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const t = useTranslations("userLibrary");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/40 py-16 text-center shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20">
      <div className="from-palette-secondary-100 to-palette-primary-100 dark:from-palette-secondary-900/30 dark:to-palette-primary-900/30 mb-6 rounded-full bg-linear-to-br p-6">
        <Icon
          icon="lucide:gamepad-2"
          className="text-palette-secondary-500 dark:text-palette-secondary-400 h-12 w-12"
        />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {hasFilters ? t("empty.noGamesFound") : t("empty.title")}
      </h3>
      <p className="mb-6 max-w-md px-4 text-sm text-gray-500 dark:text-slate-400">
        {hasFilters ? t("empty.modifySearch") : t("empty.description")}
      </p>
      {hasFilters ? (
        <Button
          onClick={onClearFilters}
          className="from-palette-secondary-500 to-palette-primary-500 hover:from-palette-secondary-600 hover:to-palette-primary-600 bg-linear-to-r text-white"
        >
          {t("empty.clearFilters")}
        </Button>
      ) : (
        <Button
          asChild
          className="from-palette-secondary-500 to-palette-primary-500 hover:from-palette-secondary-600 hover:to-palette-primary-600 bg-linear-to-r text-white"
        >
          <Link href="/games">
            <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
            {t("empty.exploreGames")}
          </Link>
        </Button>
      )}
    </div>
  );
}
