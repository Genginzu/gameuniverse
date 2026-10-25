"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/shared/EmptyState";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { SearchSkeleton } from "@/components/games/SearchSkeleton";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { useGenres } from "@/hooks/useGenres";
import { useGameMetadataFilters } from "@/hooks/useGameMetadataFilters";
import { useListingQuery } from "@/hooks/useListingQuery";
import { usePlatforms } from "@/hooks/usePlatforms";
import { gamesListing } from "@/lib/listing/resources/games";
import type { GamesApiResponse } from "@/types/game";
import type { MetadataFilterSelection } from "@/types/game-metadata";

import { GameCard } from "./GameCard";
import { metadataFilterCount } from "./GameMetadataFilters";
import { GamesListingToolbar } from "./GamesListingToolbar";
import { GamesUrlFilters } from "./GamesUrlFilters";

const GameFilters = dynamic(() => import("./GameFilters").then((m) => m.GameFilters));
const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);

interface GamesListingEditorialProps {
  locale?: string;
  initialData?: GamesApiResponse;
}

export function GamesListingEditorial({ locale = "fr", initialData }: GamesListingEditorialProps) {
  const t = useTranslations("games");
  const [showFilters, setShowFilters] = useState(false);

  const { genres } = useGenres(locale);
  const { platforms } = usePlatforms(locale);
  const { filters, setFilters, setPage, data, isLoading, isValidating } = useListingQuery(
    gamesListing,
    { locale, fallbackData: initialData }
  );
  const metadataSelection: MetadataFilterSelection = {
    themes: filters.themes,
    gameModes: filters.gameModes,
    perspectives: filters.perspectives,
    engines: filters.engines,
    franchises: filters.franchises,
  };
  const { options: metadataOptions, loading: metadataLoading } = useGameMetadataFilters({
    engines: filters.engines,
    franchises: filters.franchises,
  });

  const games = data?.games ?? [];
  const pagination = data?.pagination ?? null;
  const filterCount =
    filters.genres.length +
    filters.platforms.length +
    (filters.esport !== null ? 1 : 0) +
    metadataFilterCount(metadataSelection);
  const hasFilters = filterCount > 0;
  const transitioning = isValidating && !isLoading;

  const handleClearFilters = () =>
    setFilters({
      genres: [],
      platforms: [],
      esport: null,
      themes: [],
      gameModes: [],
      perspectives: [],
      engines: [],
      franchises: [],
    });

  const urlFilters = (
    <Suspense fallback={null}>
      <GamesUrlFilters onFilters={setFilters} />
    </Suspense>
  );

  if (isLoading && games.length === 0) {
    return (
      <>
        {urlFilters}
        <SearchSkeleton />
      </>
    );
  }

  return (
    <section className="w-full">
      {urlFilters}
      <EditorialContainer>
        <GamesListingToolbar
          totalCount={pagination?.totalCount ?? games.length}
          hasFilters={hasFilters}
          filterCount={filterCount}
          onToggleFilters={() => setShowFilters((v) => !v)}
          sort={filters.sort}
          onSortChange={(sort) => setFilters({ sort })}
        />

        <div className="mb-6">
          <GameFilters
            genres={genres}
            platforms={platforms}
            selectedGenres={filters.genres}
            selectedPlatforms={filters.platforms}
            esportFilter={filters.esport}
            onGenreChange={(next) => setFilters({ genres: next })}
            onPlatformsChange={(next) => setFilters({ platforms: next })}
            onEsportChange={(esport) => setFilters({ esport })}
            onClearFilters={handleClearFilters}
            showAllGenres={showFilters}
            variant="editorial"
            metadataFilters={{
              selected: metadataSelection,
              options: metadataOptions,
              loading: metadataLoading,
              onChange: setFilters,
            }}
          />
        </div>

        <div
          className="transition-opacity duration-200 data-[revalidating=true]:opacity-50 motion-reduce:transition-none"
          data-revalidating={transitioning ? "true" : "false"}
        >
          {games.length === 0 && !isValidating ? (
            <EmptyState
              icon="lucide:gamepad-2"
              title={t("noGamesFound")}
              description={hasFilters ? t("modifySearch") : t("noGamesAvailable")}
              action={
                hasFilters ? { label: t("clearFilters"), onClick: handleClearFilters } : undefined
              }
            />
          ) : (
            <LibraryStatusProvider gameIds={games.map((g) => g.id)}>
              <div
                className="grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 min-[1536px]:grid-cols-6 min-[1536px]:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5"
                data-testid="editorial-games-listing-grid"
              >
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
                onPageChange={setPage}
                loading={isValidating}
                translationNamespace="pagination"
                variant="editorial"
              />
            </div>
          )}
        </div>
      </EditorialContainer>
    </section>
  );
}
