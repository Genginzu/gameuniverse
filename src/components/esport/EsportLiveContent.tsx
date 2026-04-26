"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";

interface LiveStream {
  matchId: number;
  matchName: string;
  game: string;
  gameSlug: string;
  league: string;
  streamUrl: string;
  language: string;
  isMain: boolean;
  opponents: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportLiveContent() {
  const t = useTranslations("esport.live");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const gamesUrl = "/api/esport/calendar?games_only=true";
  const liveUrl = selectedGame
    ? `/api/esport/live?game=${encodeURIComponent(selectedGame)}`
    : "/api/esport/live";

  const { data: gamesData } = useSWR<{ games: string[] }>(gamesUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const { data, isLoading } = useSWR<{ streams: LiveStream[] }>(liveUrl, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 120_000, // Refresh every 2 min
    keepPreviousData: true,
  });

  const games = gamesData?.games ?? [];
  const streams = data?.streams ?? [];

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
              />
            ))}
          </div>
        )}

        {isLoading && streams.length === 0 ? (
          <LiveSkeleton />
        ) : streams.length === 0 ? (
          <EmptyState
            icon="mdi:broadcast-off"
            title={t("noStreams")}
            description={t("noStreamsDescription")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {streams.map((stream, idx) => (
              <StreamCard key={`${stream.matchId}-${idx}`} stream={stream} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StreamCard({ stream }: { stream: LiveStream }) {
  const t = useTranslations("esport.live");

  return (
    <a
      href={stream.streamUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card group block rounded-2xl p-4 transition-all duration-300 hover:shadow-lg sm:p-5"
    >
      <div className="mb-2 flex items-center justify-between">
        <Badge className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {t("liveNow")}
        </Badge>
        {stream.isMain && (
          <Badge className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            {t("mainStream")}
          </Badge>
        )}
      </div>

      <h3 className="mb-1 line-clamp-2 text-sm font-bold text-gray-900 sm:text-base dark:text-white">
        {stream.matchName}
      </h3>

      {stream.opponents.length > 0 && (
        <p className="mb-2 text-xs text-gray-600 dark:text-gray-300">
          {stream.opponents.join(" vs ")}
        </p>
      )}

      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:gamepad-variant" className="h-3.5 w-3.5" />
          <span>{stream.game}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:trophy" className="h-3.5 w-3.5" />
          <span>{stream.league}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:translate" className="h-3.5 w-3.5" />
          <span className="uppercase">{stream.language}</span>
        </div>
      </div>

      <div className="text-palette-primary-500 mt-3 flex items-center gap-1 text-xs font-medium group-hover:underline">
        <Icon icon="mdi:open-in-new" className="h-3.5 w-3.5" />
        {t("watchStream")}
      </div>
    </a>
  );
}

function LiveSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <Skeleton className="mb-2 h-5 w-16 rounded-full" />
          <Skeleton className="mb-1 h-5 w-3/4" />
          <Skeleton className="mb-3 h-3 w-1/2" />
          <Skeleton className="mb-1 h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
