"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerHero } from "./PlayerHero";
import { PlayerAboutCard, PlayerTeamCard } from "./PlayerInfoCards";
import { PlayerRecentMatches } from "./PlayerRecentMatches";
import type { PlayerDetail } from "./player-detail-types";
import type { PlayerMatch } from "@/lib/services/esportPlayerMatchesService";

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

  const { data, isLoading, error } = useSWR<EsportPlayerDetailData>(
    `/api/esport/players/${playerId}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false }
  );

  const { data: matchesData, isLoading: matchesLoading } = useSWR<{ matches: PlayerMatch[] }>(
    `/api/esport/players/${playerId}/matches`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <PlayerDetailSkeleton />;
  if (error || !data?.player) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">{t("loadError")}</p>
      </div>
    );
  }

  const player = data.player;
  const matches = matchesData?.matches ?? [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <PlayerHero player={player} />

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <PlayerAboutCard player={player} />
            {player.teamName && <PlayerTeamCard player={player} />}
          </div>
          <div className="lg:col-span-3">
            <PlayerRecentMatches matches={matches} isLoading={matchesLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="from-palette-secondary-500/40 to-palette-primary-500/40 mb-6 rounded-3xl bg-linear-to-br p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Skeleton className="h-32 w-32 rounded-full sm:h-40 sm:w-40" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
      </div>
    </div>
  );
}
