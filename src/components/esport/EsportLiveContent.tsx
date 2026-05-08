"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { LazyImage } from "@/components/ui/lazy-image";
import { Link } from "@/i18n/navigation";
import { getGameIcon } from "@/lib/utils/esport-utils";

interface LiveMatch {
  id: number;
  name: string;
  beginAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  tournament: string;
  opponents: Array<{ id: number | null; name: string; imageUrl: string | null; score: number }>;
}

export interface EsportLiveData {
  matches: LiveMatch[];
}

interface EsportLiveContentProps {
  initialData?: EsportLiveData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportLiveContent({ initialData }: EsportLiveContentProps) {
  const t = useTranslations("esport.live");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const gamesUrl = "/api/esport/tournaments?games_only=true";
  const liveUrl = selectedGame
    ? `/api/esport/live?game=${encodeURIComponent(selectedGame)}`
    : "/api/esport/live";

  const fallbackData = !selectedGame ? initialData : undefined;

  const { data: gamesData } = useSWR<{ games: string[] }>(gamesUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const { data, isLoading } = useSWR<EsportLiveData>(liveUrl, fetcher, {
    fallbackData,
    revalidateOnFocus: false,
    refreshInterval: 120_000,
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
    </div>
  );
}

function LiveMatchCard({ match }: { match: LiveMatch }) {
  const t = useTranslations("esport.live");
  const [opponentA, opponentB] = match.opponents;

  return (
    <div className="glass-card group block rounded-2xl p-4 transition-all duration-300 hover:shadow-lg sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <Badge className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {t("liveNow")}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Icon icon={getGameIcon(match.gameSlug)} className="h-3.5 w-3.5" />
          <span>{match.game}</span>
        </div>
      </div>

      <p className="mb-3 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
        {match.league} · {match.tournament}
      </p>

      {opponentA && opponentB ? (
        <div className="flex items-center justify-between gap-3">
          <OpponentScore opponent={opponentA} />
          <span className="text-xs font-bold text-gray-400">VS</span>
          <OpponentScore opponent={opponentB} align="right" />
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-200">{match.name}</p>
      )}
    </div>
  );
}

function OpponentScore({
  opponent,
  align = "left",
}: {
  opponent: LiveMatch["opponents"][number];
  align?: "left" | "right";
}) {
  const inner = (
    <>
      {opponent.imageUrl ? (
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white p-0.5 dark:bg-gray-700">
          <LazyImage
            src={opponent.imageUrl}
            alt={opponent.name}
            fill
            className="object-contain"
            sizes="32px"
          />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Icon icon="mdi:shield-account" className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <span className="line-clamp-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
        {opponent.name}
      </span>
      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        {opponent.score}
      </span>
    </>
  );

  const className = `flex flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`;

  if (opponent.id !== null) {
    return (
      <Link href={`/esport/teams/${opponent.id}`} className={`${className} hover:underline`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

function LiveSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <Skeleton className="mb-3 h-5 w-16 rounded-full" />
          <Skeleton className="mb-3 h-3 w-2/3" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
