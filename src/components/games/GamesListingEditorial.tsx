"use client";

/**
 * GamesListingEditorial : page Games (`/games`) au look éditorial.
 *
 * Remplace `AllGamesContent` (legacy DashboardLayout). Conserve la
 * logique métier à l'identique :
 *   - Hooks `useGameListing`, `useGenres`, `usePlatforms`
 *   - Filtres genres / plateformes / esport, tri, pagination
 *   - Pattern ISR avec `fallbackData` SWR sur la vue par défaut
 *   - `LibraryStatusProvider` pour les indicateurs bibliothèque
 *
 * Change uniquement la coquille visuelle :
 *   - Hero léger (kicker + titre display + count)
 *   - Grille de `EditorialGameCard` (cover plein + footer + arrow)
 *   - Couleurs éditoriales (`--editorial-*`)
 */

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/shared/EmptyState";
import { FilterButton } from "@/components/shared/FilterButton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { GameSortMenu } from "@/components/games/GameSortMenu";
import { SearchSkeleton } from "@/components/games/SearchSkeleton";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { useGameListing, useGenres, usePlatforms, type GamesApiResponse } from "@/hooks/useGameListing";
import {
  DEFAULT_GAME_LISTING_SORT,
  type GameListingSort,
  type GameSummary,
} from "@/types/game";
import type { Pagination as PaginationType } from "@/types/pagination";

import { EditorialGameCard } from "./EditorialGameCard";

const GameFilters = dynamic(() =>
  import("./GameFilters").then((m) => m.GameFilters)
);
const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);

interface GamesListingEditorialProps {
  locale?: string;
  initialGames?: GameSummary[];
  initialPagination?: PaginationType | null;
}

export function GamesListingEditorial({
  locale = "fr",
  initialGames,
  initialPagination,
}: GamesListingEditorialProps) {
  const t = useTranslations("games");

  // ---------- Filtres et état ----------
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [esportFilter, setEsportFilter] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<GameListingSort>(DEFAULT_GAME_LISTING_SORT);

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

  // ---------- Data hooks ----------
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

  // ---------- Handlers ----------
  const handleGenreFilter = useCallback((next: string[]) => {
    setSelectedGenres(next);
    setCurrentPage(1);
  }, []);

  const handlePublisherFilter = useCallback((next: string[]) => {
    setSelectedPublishers(next);
  }, []);

  const handlePlatformFilter = useCallback((next: string[]) => {
    setSelectedPlatforms(next);
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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

  const filterCount =
    selectedGenres.length + selectedPlatforms.length + (esportFilter !== null ? 1 : 0);

  // ---------- Render ----------
  if (initialLoading) {
    return <SearchSkeleton />;
  }

  const totalCount = pagination?.totalCount ?? games.length;

  return (
    <section className="editorial-games-listing">
      <div className="editorial-games-listing-inner">
        {/* Hero léger */}
        <header className="editorial-games-listing-hero">
          <KickerLabel>{t("listingKicker")}</KickerLabel>
          <h1 className="editorial-games-listing-title">{t("listingTitle")}</h1>
          <p className="editorial-games-listing-meta">
            <span>{t("listingDescription")}</span>
            <span>·</span>
            <span className="editorial-games-listing-count">
              {t("listingCount", { count: totalCount })}
            </span>
          </p>
        </header>

        {/* Contrôles : filter button + sort menu */}
        <div className="editorial-games-listing-controls">
          <FilterButton
            hasFilters={hasFilters}
            filterCount={filterCount}
            onClick={() => setShowFilters((v) => !v)}
          />
          <GameSortMenu value={sort} onChange={handleSortChange} />
        </div>

        {/* Filtres collapsibles */}
        <div className="editorial-games-listing-filters">
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
            variant="editorial"
          />
        </div>

        {/* Grille / état vide */}
        <div
          className="editorial-games-listing-content"
          data-revalidating={transitioning ? "true" : "false"}
        >
          {games.length === 0 && !validating ? (
            <EmptyState
              icon="lucide:gamepad-2"
              title={t("noGamesFound")}
              description={hasFilters ? t("modifySearch") : t("noGamesAvailable")}
              action={
                hasFilters
                  ? { label: t("clearFilters"), onClick: handleClearFilters }
                  : undefined
              }
            />
          ) : (
            <LibraryStatusProvider gameIds={games.map((g) => g.id)}>
              <div
                className="editorial-games-listing-grid"
                data-testid="editorial-games-listing-grid"
              >
                {games.map((game, index) => (
                  <EditorialGameCard
                    key={game.id}
                    game={game}
                    priority={index < 5}
                  />
                ))}
              </div>
            </LibraryStatusProvider>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="editorial-games-listing-pagination">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={handlePageChange}
                loading={validating}
                translationNamespace="pagination"
                variant="editorial"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
