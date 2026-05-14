"use client";

/**
 * LibraryEditorial : page Library (`/library`) au look éditorial.
 *
 * Conserve toute la logique métier intacte :
 *   - Hook `useLibraryGames` (search, filtres, pagination, mutations)
 *   - `LibraryStatusProvider` pour les indicateurs bibliothèque
 *
 * Change uniquement la coquille visuelle :
 *   - Hero éditorial 5/7 (kicker + titre display + subtitle | stats inline)
 *   - Search + filter button
 *   - Grille `EditorialGameCard` (cohérent avec /games)
 *   - Surfaces sombres `--editorial-bg-2`, accent dynamique magenta default
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GameSearchBar } from "@/components/games/GameSearchBar";
import { EditorialGameCard } from "@/components/games/EditorialGameCard";
import { FilterButton } from "@/components/shared/FilterButton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";

import { useLibraryGames } from "@/hooks/useLibraryGames";

import { LibraryPageSkeleton } from "./LibraryPageSkeleton";
import { LibraryLoadingState } from "./LibraryLoadingState";

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
  } = useLibraryGames(locale);

  if (initialLoading) {
    return <LibraryPageSkeleton />;
  }

  const completedPercent =
    stats.totalGames > 0 ? Math.round((stats.completedGames / stats.totalGames) * 100) : 0;

  return (
    <section className="editorial-library">
      <div className="editorial-library-inner">
        {/* Hero */}
        <header className="editorial-library-hero">
          <div>
            <KickerLabel>{t("editorial.kicker")}</KickerLabel>
            <h1 className="editorial-library-hero-title">
              {t("editorial.titlePrefix")}{" "}
              <span className="accent">{t("editorial.titleAccent")}</span>
            </h1>
            <p className="editorial-library-hero-subtitle">{t("editorial.subtitle")}</p>
          </div>

          {/* Stats inline */}
          <div className="editorial-library-stats">
            <Stat label={t("editorial.stats.games")} value={String(stats.totalGames)} />
            <Stat
              label={t("editorial.stats.completed")}
              value={
                <>
                  {stats.completedGames}
                  <span className="editorial-library-stat-suffix"> · {completedPercent}%</span>
                </>
              }
            />
            <Stat
              label={t("editorial.stats.playtime")}
              value={
                <>
                  {stats.totalPlayTime}
                  <span className="editorial-library-stat-suffix">h</span>
                </>
              }
            />
            <Stat
              label={t("editorial.stats.rating")}
              value={
                stats.averageRating !== undefined && stats.averageRating !== null ? (
                  <>
                    {stats.averageRating.toFixed(1)}
                    <span className="editorial-library-stat-suffix">/5</span>
                  </>
                ) : (
                  "—"
                )
              }
              accent
            />
          </div>
        </header>

        {/* Controls */}
        <div className="editorial-library-controls">
          <div className="editorial-library-search">
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
          />
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
          className="editorial-library-content"
          data-revalidating={loading && games.length > 0 ? "true" : "false"}
        >
          {loading && games.length === 0 ? (
            <LibraryLoadingState />
          ) : !loading && games.length === 0 ? (
            <LibraryEmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
          ) : (
            <LibraryStatusProvider gameIds={games.map((g) => g.id)}>
              <div className="editorial-library-grid" data-testid="editorial-library-grid">
                {games.map((game, index) => (
                  <EditorialGameCard key={game.id} game={game} priority={index < 5} />
                ))}
              </div>
            </LibraryStatusProvider>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="editorial-library-pagination">
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
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p className={`editorial-library-stat-value${accent ? "accent" : ""}`}>{value}</p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}

/** État vide — bibliothèque vide ou aucun résultat de recherche. */
function LibraryEmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const t = useTranslations("userLibrary");

  return (
    <div className="editorial-library-empty">
      <div className="editorial-library-empty-icon">
        <Icon icon="lucide:gamepad-2" className="h-7 w-7" />
      </div>
      <h3 className="editorial-library-empty-title">
        {hasFilters ? t("empty.noGamesFound") : t("empty.title")}
      </h3>
      <p className="editorial-library-empty-text">
        {hasFilters ? t("empty.modifySearch") : t("empty.description")}
      </p>
      {hasFilters ? (
        <Button onClick={onClearFilters}>{t("empty.clearFilters")}</Button>
      ) : (
        <Button asChild>
          <Link href="/games">
            <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
            {t("empty.exploreGames")}
          </Link>
        </Button>
      )}
    </div>
  );
}
