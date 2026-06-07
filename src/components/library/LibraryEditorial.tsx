"use client";

/**
 * LibraryEditorial : page Library (`/library`) au look éditorial.
 *
 * Conserve toute la logique métier intacte :
 *   - Hook `useLibraryGames` (search, filtres, pagination, mutations)
 *   - `LibraryStatusProvider` pour les indicateurs bibliothèque
 *
 * Style : Tailwind inline + tokens éditoriaux. Le loader (`LibraryLoadingState`)
 * garde ses animations keyframes en CSS (scan/breath) — voir library.css.
 */

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GameSearchBar } from "@/components/games/GameSearchBar";
import { GameCard } from "@/components/games/GameCard";
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

const GRID =
  "grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 min-[1536px]:grid-cols-6 min-[1536px]:gap-5";

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
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        {/* Hero */}
        <header className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
          <div>
            <KickerLabel>{t("editorial.kicker")}</KickerLabel>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
              {t("editorial.titlePrefix")}{" "}
              <span className="text-editorial-accent">{t("editorial.titleAccent")}</span>
            </h1>
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">
              {t("editorial.subtitle")}
            </p>
          </div>

          {/* Stats inline */}
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
                  <Suffix>h</Suffix>
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
        </header>

        {/* Controls */}
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
          className="transition-opacity duration-200 data-[revalidating=true]:opacity-50"
          data-revalidating={loading && games.length > 0 ? "true" : "false"}
        >
          {loading && games.length === 0 ? (
            <LibraryLoadingState />
          ) : !loading && games.length === 0 ? (
            <LibraryEmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
          ) : (
            <LibraryStatusProvider gameIds={games.map((g) => g.id)}>
              <div className={GRID} data-testid="editorial-library-grid">
                {games.map((game, index) => (
                  <GameCard key={game.id} game={game} priority={index < 5} />
                ))}
              </div>
            </LibraryStatusProvider>
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
      </div>
    </section>
  );
}

function Suffix({ children }: { children: ReactNode }) {
  return <span className="text-sm font-light text-white/40">{children}</span>;
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
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:gamepad-2" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">
        {hasFilters ? t("empty.noGamesFound") : t("empty.title")}
      </h3>
      <p className="text-editorial-muted max-w-[50ch]">
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
