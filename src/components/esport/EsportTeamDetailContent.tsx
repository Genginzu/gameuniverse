"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";

interface TeamDetail {
  id: number;
  name: string;
  slug: string;
  acronym: string | null;
  imageUrl: string | null;
  location: string | null;
  game: string | null;
  players: Array<{
    id: number;
    name: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    role: string | null;
    nationality: string | null;
  }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportTeamDetailContent({ teamId }: { teamId: string }) {
  const t = useTranslations("esport.teams");
  const { data, isLoading, error } = useSWR<{ team: TeamDetail }>(
    `/api/esport/teams/${teamId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <TeamDetailSkeleton />;
  if (error || !data?.team) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">{t("loadError")}</p>
      </div>
    );
  }

  const team = data.team;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="glass-card mb-6 flex flex-col items-center gap-4 rounded-2xl p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white/50 dark:bg-gray-700/50">
            {team.imageUrl ? (
              <LazyImage src={team.imageUrl} alt={team.name} fill className="object-contain p-2" sizes="96px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon icon="mdi:shield-account" className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl lg:text-3xl">
              {team.name}
            </h1>
            {team.acronym && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{team.acronym}</span>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {team.game && (
                <Badge className="rounded-full bg-palette-primary-100 px-3 py-1 text-xs text-palette-primary-700 dark:bg-palette-primary-900/30 dark:text-palette-primary-300">
                  {team.game}
                </Badge>
              )}
              {team.location && (
                <Badge className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <Icon icon="mdi:map-marker" className="mr-1 inline h-3 w-3" />
                  {team.location}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Roster */}
        {team.players.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              {t("roster")}
            </h2>
            <div className="grid gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {team.players.map((player) => (
                <div
                  key={player.id}
                  className="glass-card flex items-center gap-3 rounded-xl p-3 sm:p-4"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    {player.imageUrl ? (
                      <LazyImage src={player.imageUrl} alt={player.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon icon="mdi:account" className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {player.name}
                    </p>
                    {player.role && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{player.role}</p>
                    )}
                    {player.nationality && (
                      <p className="text-xs text-gray-400">{player.nationality}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="glass-card mb-6 flex flex-col items-center gap-4 rounded-2xl p-8 sm:flex-row sm:items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="grid gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card flex items-center gap-3 rounded-xl p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="mb-1 h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
