"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { PredictionDialog } from "@/components/esport/PredictionDialog";
import { useAuth } from "@/hooks/useAuth";
import { useEsportGameOptions } from "@/hooks/useEsportGameOptions";
import { useListingQuery } from "@/hooks/useListingQuery";
import { esportTournamentsListing } from "@/lib/listing/resources/esport";
import type { EsportCalendarTournament } from "@/types/esport";
import { CalendarSkeleton, GAME_LOGOS, TournamentCard } from "./EsportTournamentCard";

export interface EsportTournamentsData {
  tournaments: EsportCalendarTournament[];
}

interface EsportTournamentsContentProps {
  initialData?: EsportTournamentsData;
}

export function EsportTournamentsContent({ initialData }: EsportTournamentsContentProps) {
  const t = useTranslations("esport.tournaments");
  const { user } = useAuth();
  const [betTournament, setBetTournament] = useState<{ id: number; name: string } | null>(null);
  const games = useEsportGameOptions("tournaments");
  const { filters, setFilters, data, isLoading } = useListingQuery(esportTournamentsListing, {
    fallbackData: initialData,
  });

  const selectedGame = filters.game;
  const tournaments = data?.tournaments ?? [];

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
              icon={
                GAME_LOGOS[game] ? (
                  <img src={GAME_LOGOS[game]} alt="" className="size-4 rounded-sm object-contain" />
                ) : undefined
              }
              selected={selectedGame === game}
              onClick={() => handleGameFilter(game)}
            />
          ))}
        </div>
      )}

      {isLoading && tournaments.length === 0 ? (
        <CalendarSkeleton />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon="mdi:calendar-blank"
          title={t("noTournaments")}
          description={t("noTournamentsDescription")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onBet={
                user
                  ? () => setBetTournament({ id: tournament.id, name: tournament.name })
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {betTournament && (
        <PredictionDialog
          open={!!betTournament}
          onOpenChange={(open) => {
            if (!open) setBetTournament(null);
          }}
          tournamentId={betTournament.id}
          tournamentName={betTournament.name}
        />
      )}
    </div>
  );
}
