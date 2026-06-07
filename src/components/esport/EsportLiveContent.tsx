"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
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
  streams: Array<{ language: string; main: boolean; rawUrl: string }>;
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

function LiveMatchCard({ match }: { match: LiveMatch }) {
  const t = useTranslations("esport.live");
  const [opponentA, opponentB] = match.opponents;

  return (
    <div className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 group block rounded-2xl border p-4 transition-all duration-300 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <Badge className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {t("liveNow")}
        </Badge>
        <div className="text-editorial-muted flex items-center gap-1 text-xs">
          <Icon icon={getGameIcon(match.gameSlug)} className="h-3.5 w-3.5" />
          <span>{match.game}</span>
        </div>
      </div>

      <p className="text-editorial-muted mb-3 line-clamp-1 text-xs">
        {match.league} · {match.tournament}
      </p>

      {opponentA && opponentB ? (
        <div className="flex items-center justify-between gap-3">
          <OpponentScore opponent={opponentA} />
          <span className="text-editorial-muted text-xs font-bold">VS</span>
          <OpponentScore opponent={opponentB} align="right" />
        </div>
      ) : (
        <p className="text-sm text-white/85">{match.name}</p>
      )}

      {match.streams.length > 0 && (
        <div className="border-editorial-line mt-4 border-t pt-3">
          <div className="flex flex-wrap gap-1.5">
            {match.streams.slice(0, 3).map((stream) => (
              <a
                key={stream.rawUrl}
                href={stream.rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  stream.main
                    ? "bg-editorial-accent text-white hover:opacity-90"
                    : "text-editorial-muted bg-white/10 hover:bg-white/15"
                }`}
              >
                <Icon icon="mdi:play-circle" className="h-3.5 w-3.5" />
                <span className="uppercase">{stream.language || t("watchStream")}</span>
              </a>
            ))}
          </div>
        </div>
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
        <div className="bg-editorial-3 relative h-8 w-8 shrink-0 overflow-hidden rounded-full p-0.5">
          <LazyImage
            src={opponent.imageUrl}
            alt={opponent.name}
            fill
            className="object-contain"
            sizes="32px"
          />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Icon icon="mdi:shield-account" className="text-editorial-muted h-4 w-4" />
        </div>
      )}
      <span className="line-clamp-1 text-sm font-semibold text-white/90">
        {opponent.name}
      </span>
      <span className="rounded-md bg-white/10 px-2 py-0.5 text-sm font-bold text-white">
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
        <div key={i} className="border-editorial-line bg-editorial-2 rounded-2xl border p-5">
          <div className="mb-3 h-5 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mb-3 h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
          <div className="flex items-center justify-between gap-3">
            <div className="h-8 w-1/3 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-8 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-8 w-1/3 animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
