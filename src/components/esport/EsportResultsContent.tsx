"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageBanner } from "@/components/shared/PageBanner";
import { FilterChip } from "@/components/shared/FilterChip";

interface ResultMatch {
  id: number;
  name: string;
  status: string;
  beginAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  tournament: string;
  opponents: Array<{ name: string; imageUrl: string | null; score: number }>;
  winnerId: number | null;
}

interface ResultsResponse {
  tournaments: unknown[];
  matches: ResultMatch[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportResultsContent() {
  const t = useTranslations("esport.results");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const calendarGamesUrl = "/api/esport/calendar?games_only=true";
  const resultsUrl = selectedGame
    ? `/api/esport/results?game=${encodeURIComponent(selectedGame)}`
    : "/api/esport/results";

  const { data: gamesData } = useSWR<{ games: string[] }>(calendarGamesUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const { data, isLoading } = useSWR<ResultsResponse>(resultsUrl, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const games = gamesData?.games ?? [];
  const matches = data?.matches ?? [];

  const handleGameFilter = useCallback(
    (game: string) => setSelectedGame((prev) => (prev === game ? null : game)),
    []
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <PageBanner title={t("title")} subtitle={t("subtitle")} icon="mdi:podium" />

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
    </div>
  );
}

function MatchCard({ match }: { match: ResultMatch }) {
  const t = useTranslations("esport.results");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [teamA, teamB] = match.opponents;

  return (
    <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:shadow-lg sm:p-5">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Icon icon="mdi:gamepad-variant" className="h-3.5 w-3.5" />
          {match.game}
        </span>
        <span>{formatDate(match.beginAt)}</span>
      </div>

      <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
        {match.league} · {match.tournament}
      </p>

      {teamA && teamB ? (
        <div className="flex items-center justify-between gap-3">
          <TeamScore team={teamA} isWinner={teamA.score > teamB.score} />
          <span className="text-xs font-bold text-gray-400">VS</span>
          <TeamScore team={teamB} isWinner={teamB.score > teamA.score} align="right" />
        </div>
      ) : (
        <p className="text-sm text-gray-500">{match.name}</p>
      )}

      <div className="mt-2">
        <Badge className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {t("finished")}
        </Badge>
      </div>
    </div>
  );
}

function TeamScore({
  team,
  isWinner,
  align = "left",
}: {
  team: { name: string; score: number };
  isWinner: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <span
        className={`text-sm font-semibold ${isWinner ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}
      >
        {team.name}
      </span>
      <span
        className={`rounded-lg px-2 py-0.5 text-sm font-bold ${
          isWinner
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }`}
      >
        {team.score}
      </span>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <Skeleton className="mb-2 h-3 w-1/4" />
          <Skeleton className="mb-3 h-3 w-1/3" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
