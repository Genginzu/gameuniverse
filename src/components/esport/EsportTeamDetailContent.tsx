"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
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

export interface EsportTeamDetailData {
  team: TeamDetail;
}

interface EsportTeamDetailContentProps {
  teamId: string;
  initialData?: EsportTeamDetailData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportTeamDetailContent({ teamId, initialData }: EsportTeamDetailContentProps) {
  const t = useTranslations("esport.teams");
  const { data, isLoading, error } = useSWR<EsportTeamDetailData>(
    `/api/esport/teams/${teamId}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false }
  );

  if (isLoading) return <TeamDetailSkeleton />;
  if (error || !data?.team) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-editorial-muted">{t("loadError")}</p>
      </div>
    );
  }

  const team = data.team;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="border-editorial-line bg-editorial-2 mb-6 flex flex-col items-center gap-4 rounded-2xl border p-6 sm:flex-row sm:items-start sm:p-8">
        <div className="bg-editorial-3 relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
          {team.imageUrl ? (
            <LazyImage
              src={team.imageUrl}
              alt={team.name}
              fill
              className="object-contain p-2"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon icon="mdi:shield-account" className="text-editorial-muted h-12 w-12" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
            {team.name}
          </h1>
          {team.acronym && <span className="text-editorial-muted text-sm">{team.acronym}</span>}
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            {team.game && (
              <Badge className="bg-editorial-accent/15 text-editorial-accent rounded-full px-3 py-1 text-xs">
                {team.game}
              </Badge>
            )}
            {team.location && (
              <Badge className="text-editorial-muted rounded-full bg-white/10 px-3 py-1 text-xs">
                <Icon icon="mdi:map-marker" className="mr-1 inline h-3 w-3" />
                {team.location}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {team.players.length > 0 && (
        <div>
          <h2 className="font-display mb-4 text-lg font-bold tracking-tight text-white sm:text-xl">
            {t("roster")}
          </h2>
          <div className="xs:grid-cols-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {team.players.map((player) => (
              <div
                key={player.id}
                className="border-editorial-line bg-editorial-2 flex items-center gap-3 rounded-xl border p-3 sm:p-4"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                  {player.imageUrl ? (
                    <LazyImage
                      src={player.imageUrl}
                      alt={player.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon icon="mdi:account" className="text-editorial-muted h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{player.name}</p>
                  {player.role && <p className="text-editorial-muted text-xs">{player.role}</p>}
                  {player.nationality && (
                    <p className="text-editorial-muted text-xs">{player.nationality}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="border-editorial-line bg-editorial-2 mb-6 flex flex-col items-center gap-4 rounded-2xl border p-8 sm:flex-row sm:items-start">
        <div className="h-24 w-24 animate-pulse rounded-full bg-white/[0.06]" />
        <div>
          <div className="mb-2 h-7 w-48 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-white/[0.06]" />
      <div className="xs:grid-cols-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-editorial-line bg-editorial-2 flex items-center gap-3 rounded-xl border p-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.06]" />
            <div>
              <div className="mb-1 h-4 w-20 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-14 animate-pulse rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
