"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";

interface PlayerDetail {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  imageUrl: string | null;
  role: string | null;
  teamName: string | null;
  teamImageUrl: string | null;
  game: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportPlayerDetailContent({ playerId }: { playerId: string }) {
  const t = useTranslations("esport.players");
  const { data, isLoading, error } = useSWR<{ player: PlayerDetail }>(
    `/api/esport/players/${playerId}`,
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
  const fullName = [player.firstName, player.lastName].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            {player.imageUrl ? (
              <LazyImage src={player.imageUrl} alt={player.name} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon icon="mdi:account" className="h-14 w-14 text-gray-400" />
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl lg:text-3xl">
              {player.name}
            </h1>
            {fullName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{fullName}</p>
            )}

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {player.role && (
                <Badge className="rounded-full bg-palette-primary-100 px-3 py-1 text-xs text-palette-primary-700 dark:bg-palette-primary-900/30 dark:text-palette-primary-300">
                  {player.role}
                </Badge>
              )}
              {player.nationality && (
                <Badge className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <Icon icon="mdi:flag" className="mr-1 inline h-3 w-3" />
                  {player.nationality}
                </Badge>
              )}
              {player.game && (
                <Badge className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {player.game}
                </Badge>
              )}
            </div>

            {player.teamName && (
              <div className="mt-4 flex items-center justify-center gap-2 sm:justify-start">
                {player.teamImageUrl && (
                  <div className="relative h-6 w-6 overflow-hidden rounded-full">
                    <LazyImage src={player.teamImageUrl} alt={player.teamName} fill className="object-contain" sizes="24px" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {player.teamName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-8 sm:flex-row sm:items-start">
        <Skeleton className="h-28 w-28 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-7 w-40" />
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
