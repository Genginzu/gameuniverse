"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { useEsportGameOptions } from "@/hooks/useEsportGameOptions";
import { useListingQuery } from "@/hooks/useListingQuery";
import { esportResultsListing } from "@/lib/listing/resources/esport";
import type { EsportResultMatch } from "@/types/esport";
import { MatchCard, ResultsSkeleton } from "./EsportResultMatchCard";

export interface EsportResultsData {
  tournaments: unknown[];
  matches: EsportResultMatch[];
}

interface EsportResultsContentProps {
  initialData?: EsportResultsData;
}

export function EsportResultsContent({ initialData }: EsportResultsContentProps) {
  const t = useTranslations("esport.results");
  const games = useEsportGameOptions("tournaments");
  const { filters, setFilters, data, isLoading } = useListingQuery(esportResultsListing, {
    fallbackData: initialData,
  });

  const selectedGame = filters.game;
  const matches = data?.matches ?? [];

  const handleGameFilter = (game: string) =>
    setFilters({ game: selectedGame === game ? null : game });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {games.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {games.map((game) => (
            <FilterChip
              key={game}
              label={game}
              selected={selectedGame === game}
              onClick={() => handleGameFilter(game)}
            />
          ))}
        </div>
      )}

      {isLoading && matches.length === 0 ? (
        <ResultsSkeleton />
      ) : matches.length === 0 ? (
        <EmptyState
          icon="mdi:scoreboard"
          title={t("noResults")}
          description={t("noResultsDescription")}
        />
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
