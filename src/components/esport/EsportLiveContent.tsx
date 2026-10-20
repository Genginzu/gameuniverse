"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { useEsportGameOptions } from "@/hooks/useEsportGameOptions";
import { useListingQuery } from "@/hooks/useListingQuery";
import { esportLiveListing } from "@/lib/listing/resources/esport";
import { getGameIcon } from "@/lib/utils/esport-utils";
import type { EsportLiveMatch } from "@/types/esport";
import { LiveMatchCard, LiveSkeleton } from "./EsportLiveMatchCard";

export interface EsportLiveData {
  matches: EsportLiveMatch[];
}

interface EsportLiveContentProps {
  initialData?: EsportLiveData;
}

export function EsportLiveContent({ initialData }: EsportLiveContentProps) {
  const t = useTranslations("esport.live");
  const games = useEsportGameOptions("tournaments");
  const { filters, setFilters, data, isLoading } = useListingQuery(esportLiveListing, {
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
              icon={<Icon icon={getGameIcon(game)} className="h-3.5 w-3.5" />}
            />
          ))}
        </div>
      )}

      {isLoading && matches.length === 0 ? (
        <LiveSkeleton />
      ) : matches.length === 0 ? (
        <EmptyState
          icon="mdi:broadcast-off"
          title={t("noStreams")}
          description={t("noStreamsDescription")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <LiveMatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
