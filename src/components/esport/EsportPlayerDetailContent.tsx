"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { PlayerHero } from "./PlayerHero";
import { PlayerAboutCard, PlayerTeamCard } from "./PlayerInfoCards";
import { PlayerRecentMatches } from "./PlayerRecentMatches";
import { PlayerStats } from "./PlayerStats";
import { PlayerTeamHistory } from "./PlayerTeamHistory";
import type { PlayerDetail } from "./player-detail-types";
import type { PlayerMatchesPage } from "@/lib/services/esportPlayerMatchesService";
import type {
  PlayerStats as PlayerStatsType,
  PlayerTeamMembership,
} from "@/lib/services/esportPlayerHistoryService";

export interface EsportPlayerDetailData {
  player: PlayerDetail;
}

interface EsportPlayerDetailContentProps {
  playerId: string;
  initialData?: EsportPlayerDetailData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportPlayerDetailContent({
  playerId,
  initialData,
}: EsportPlayerDetailContentProps) {
  const t = useTranslations("esport.players");
  const [matchesPage, setMatchesPage] = useState(1);

  const { data, isLoading, error } = useSWR<EsportPlayerDetailData>(
    `/api/esport/players/${playerId}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false }
  );

  const { data: statsData, isLoading: statsLoading } = useSWR<{ stats: PlayerStatsType }>(
    `/api/esport/players/${playerId}/stats`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: historyData, isLoading: historyLoading } = useSWR<{
    history: PlayerTeamMembership[];
  }>(`/api/esport/players/${playerId}/team-history`, fetcher, {
    revalidateOnFocus: false,
  });

  const { data: matchesData, isLoading: matchesLoading } = useSWR<PlayerMatchesPage>(
    `/api/esport/players/${playerId}/matches?page=${matchesPage}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  if (isLoading) return <PlayerDetailSkeleton />;
  if (error || !data?.player) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-editorial-muted">{t("loadError")}</p>
      </div>
    );
  }

  const player = data.player;
  const matches = matchesData?.matches ?? [];
  const total = matchesData?.total ?? 0;
  const limit = matchesData?.limit ?? 10;
  const history = historyData?.history ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PlayerHero player={player} />

      <PlayerStats stats={statsData?.stats} isLoading={statsLoading} />

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <PlayerAboutCard player={player} />
          {player.teamName && <PlayerTeamCard player={player} />}
          <PlayerTeamHistory history={history} isLoading={historyLoading} />
        </div>
        <div className="lg:col-span-3">
          <PlayerRecentMatches
            matches={matches}
            total={total}
            page={matchesPage}
            limit={limit}
            onPageChange={setMatchesPage}
            isLoading={matchesLoading}
          />
        </div>
      </div>
    </div>
  );
}

function PlayerDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="border-editorial-line bg-editorial-2 mb-6 rounded-3xl border p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="h-32 w-32 animate-pulse rounded-full bg-white/[0.06] sm:h-40 sm:w-40" />
          <div className="flex-1 space-y-3">
            <div className="h-9 w-48 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
            <div className="flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-white/[0.06]" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 h-32 animate-pulse rounded-2xl bg-white/[0.06]" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
          <div className="h-32 animate-pulse rounded-2xl bg-white/[0.06]" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-white/[0.06] lg:col-span-3" />
      </div>
    </div>
  );
}
