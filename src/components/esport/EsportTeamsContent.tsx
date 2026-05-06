"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Link } from "@/i18n/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LazyImage } from "@/components/ui/lazy-image";

interface TeamSummary {
  id: number;
  name: string;
  slug: string;
  acronym: string | null;
  imageUrl: string | null;
  location: string | null;
  game: string | null;
}

export interface EsportTeamsData {
  teams: TeamSummary[];
}

interface EsportTeamsContentProps {
  initialData?: EsportTeamsData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportTeamsContent({ initialData }: EsportTeamsContentProps) {
  const t = useTranslations("esport.teams");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const url = debouncedSearch
    ? `/api/esport/teams?search=${encodeURIComponent(debouncedSearch)}`
    : "/api/esport/teams";

  const fallbackData = !debouncedSearch ? initialData : undefined;

  const { data, isLoading } = useSWR<EsportTeamsData>(url, fetcher, {
    fallbackData,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const teams = data?.teams ?? [];

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Icon
              icon="mdi:magnify"
              className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder={t("searchPlaceholder")}
              className="glass-input w-full rounded-xl py-2.5 pr-4 pl-10 text-base"
            />
          </div>
        </div>

        {isLoading && teams.length === 0 ? (
          <TeamsSkeleton />
        ) : teams.length === 0 ? (
          <EmptyState
            icon="mdi:account-group-outline"
            title={t("noTeams")}
            description={t("noTeamsDescription")}
          />
        ) : (
          <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamCard({ team }: { team: TeamSummary }) {
  return (
    <Link href={`/esport/teams/${team.id}`}>
      <div className="glass-card group flex flex-col items-center rounded-2xl p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg sm:p-5">
        <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full bg-white/50 dark:bg-gray-700/50">
          {team.imageUrl ? (
            <LazyImage
              src={team.imageUrl}
              alt={team.name}
              fill
              className="object-contain p-1"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon icon="mdi:shield-account" className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <h3 className="line-clamp-1 text-sm font-bold text-gray-900 dark:text-white">
          {team.name}
        </h3>
        {team.acronym && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{team.acronym}</span>
        )}
        {team.game && <span className="text-palette-primary-500 mt-1 text-xs">{team.game}</span>}
        {team.location && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
            <Icon icon="mdi:map-marker" className="h-3 w-3" />
            {team.location}
          </span>
        )}
      </div>
    </Link>
  );
}

function TeamsSkeleton() {
  return (
    <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="glass-card flex flex-col items-center rounded-2xl p-5">
          <Skeleton className="mb-3 h-16 w-16 rounded-full" />
          <Skeleton className="mb-1 h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}
