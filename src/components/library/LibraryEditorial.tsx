"use client";

/**
 * LibraryEditorial : page Library (`/library`) au look éditorial.
 *
 * Conserve toute la logique métier intacte :
 *   - Hook `useLibraryGames` (search, filtres, pagination, mutations)
 *   - `LibraryGamesGrid` : cartes avec menu de statut (en cours, terminé…)
 *
 * Style : Tailwind inline + tokens éditoriaux. Le loader (`LibraryLoadingState`)
 * garde ses animations keyframes en CSS (scan/breath) — voir library.css.
 */

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { AddGameToCollection } from "@/components/collections/AddGameToCollection";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import type { AddCollectionItemInput } from "@/types/collection";
import { GameSearchBar } from "@/components/games/GameSearchBar";
import { FilterButton } from "@/components/shared/FilterButton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialPageHeader } from "@/components/shared/EditorialPageHeader";

import { useLibraryGames } from "@/hooks/useLibraryGames";
import { useAuth } from "@/hooks/useAuth";

import { LibraryPageSkeleton } from "./LibraryPageSkeleton";
import { LibraryLoadingState } from "./LibraryLoadingState";
import { LibraryGamesGrid } from "./LibraryGamesGrid";
import { LibraryStatusLegend } from "./LibraryStatusLegend";
import { LibraryAuthRequired, LibraryEmptyState } from "./LibraryEmptyStates";

const GameFilters = dynamic(() =>
  import("@/components/games/GameFilters").then((m) => m.GameFilters)
);
const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);

interface LibraryEditorialProps {
  locale?: string;
}

export function LibraryEditorial({ locale = "fr" }: LibraryEditorialProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const t = useTranslations("userLibrary");
  const { user, loading: authLoading } = useAuth();

  const {
    games,
    stats,
    genres,
    pagination,
    initialLoading,
    loading,
    queryChanging,
    searchQuery,
    selectedGenres,
    selectedPublishers,
    hasActiveFilters,
    handleSearch,
    handleGenreFilter,
    handlePublisherFilter,
    handlePageChange,
    handleClearFilters,
    refresh,
  } = useLibraryGames(locale);

  // Ajout d'un jeu à la bibliothèque depuis le dialog (même flux que l'ajout
  // à une collection, sans la note). Importe d'abord depuis IGDB si besoin
  // (géré par AddGameToCollection), puis POST /api/library.
  const handleAddGame = async ({ gameId }: AddCollectionItemInput) => {
    setIsAddingGame(true);
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      // 409 = déjà présent : on considère l'action comme aboutie côté UI.
      if (response.ok || response.status === 409) {
        refresh();
        setShowAddGameDialog(false);
      }
    } finally {
      setIsAddingGame(false);
    }
  };

  if (initialLoading) {
    return <LibraryPageSkeleton />;
  }

  const completedPercent =
    stats.totalGames > 0 ? Math.round((stats.completedGames / stats.totalGames) * 100) : 0;

  return (
    <section className="w-full">
      <EditorialContainer>
        {/* Hero */}
        <EditorialPageHeader
          kicker={t("editorial.kicker")}
          title={t("editorial.titlePrefix")}
          titleAccent={t("editorial.titleAccent")}
          subtitle={t("editorial.subtitle")}
          aside={
            <div className="border-editorial-line grid grid-cols-2 gap-6 border-y py-6 md:grid-cols-4">
              <Stat label={t("editorial.stats.games")} value={String(stats.totalGames)} />
              <Stat
                label={t("editorial.stats.completed")}
                value={
                  <>
                    {stats.completedGames}
                    <Suffix> · {completedPercent}%</Suffix>
                  </>
                }
              />
              <Stat
                label={t("editorial.stats.playtime")}
                value={
                  <>
                    {stats.totalPlayTime}
                    <Suffix className="ml-0.5">h</Suffix>
                  </>
                }
              />
              <Stat
                label={t("editorial.stats.rating")}
                value={
                  stats.averageRating !== undefined && stats.averageRating !== null ? (
                    <>
                      {stats.averageRating.toFixed(1)}
                      <Suffix>/5</Suffix>
                    </>
                  ) : (
                    "—"
                  )
                }
                accent
              />
            </div>
          }
        >
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/library/backlog"
              className="border-editorial-line text-editorial-muted inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm hover:text-white"
            >
              <Icon icon="lucide:list-checks" className="h-4 w-4" />
              {t("backlog.openManager")}
            </Link>
            <Link
              href="/library/wishlist"
              className="border-editorial-line text-editorial-muted inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm hover:text-white"
            >
              <Icon icon="lucide:star" className="h-4 w-4" />
              {t("wishlist.open")}
            </Link>
          </div>
        </EditorialPageHeader>

        {/* Controls */}
        {!authLoading && !user ? (
          <LibraryAuthRequired />
        ) : (
          <>
            <LibraryStatusLegend />
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <GameSearchBar
                  onSearch={handleSearch}
                  initialValue={searchQuery}
                  placeholder={t("editorial.searchPlaceholder")}
                  variant="editorial"
                />
              </div>
              <FilterButton
                hasFilters={selectedGenres.length > 0 || selectedPublishers.length > 0}
                filterCount={selectedGenres.length}
                onClick={() => setShowFilters((v) => !v)}
                variant="secondary"
              />
              <button
                type="button"
                onClick={() => setShowAddGameDialog(true)}
                className="btn-filled inline-flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-lg transition-all sm:h-14 sm:px-6 sm:text-base"
              >
                <Icon icon="lucide:plus" className="size-4 sm:size-5" />
                {t("addGame.trigger")}
              </button>
            </div>

            {/* Filters (collapsible) */}
            <div className="mb-6">
              <GameFilters
                genres={genres}
                platforms={[]}
                selectedGenres={selectedGenres}
                selectedPublishers={selectedPublishers}
                selectedPlatforms={[]}
                esportFilter={null}
                onGenreChange={handleGenreFilter}
                onPublisherChange={handlePublisherFilter}
                onPlatformsChange={() => {}}
                onEsportChange={() => {}}
                onClearFilters={handleClearFilters}
                showAllGenres={showFilters}
                variant="editorial"
                showPlatforms={false}
              />
            </div>

            {/* Content */}
            <div
              className="transition-opacity duration-200 data-[revalidating=true]:opacity-50"
              data-revalidating={queryChanging && games.length > 0 ? "true" : "false"}
            >
              {loading && games.length === 0 ? (
                <LibraryLoadingState />
              ) : !loading && games.length === 0 ? (
                <LibraryEmptyState
                  hasFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onAddGame={() => setShowAddGameDialog(true)}
                />
              ) : (
                <LibraryGamesGrid games={games} />
              )}

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    onPageChange={handlePageChange}
                    loading={loading}
                    translationNamespace="pagination"
                    variant="editorial"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </EditorialContainer>

      {/* Dialog d'ajout d'un jeu — même UX que l'ajout en collection, sans note */}
      <Dialog open={showAddGameDialog} onOpenChange={setShowAddGameDialog}>
        <DialogContent className="border-editorial-line bg-editorial-2 top-[8%] translate-y-0 text-white">
          <DialogHeader>
            <DialogTitle className="font-display text-white">{t("addGame.title")}</DialogTitle>
          </DialogHeader>
          <AddGameToCollection
            onAdd={handleAddGame}
            isAdding={isAddingGame}
            showNote={false}
            addButtonLabel={t("addGame.addButton")}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Suffix({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={`text-sm font-light text-white/40 ${className ?? ""}`}>{children}</span>;
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-3xl leading-none font-bold tracking-tight ${
          accent ? "text-editorial-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}
