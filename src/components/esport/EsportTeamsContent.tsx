"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="relative max-w-md">
          <Icon
            icon="mdi:magnify"
            className="text-editorial-muted absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder={t("searchPlaceholder")}
            className="border-editorial-line bg-editorial-2 w-full rounded-xl border py-2.5 pr-4 pl-10 text-base text-white placeholder:text-editorial-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
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
  );
}

function TeamCard({ team }: { team: TeamSummary }) {
  return (
    <Link href={`/esport/teams/${team.id}`}>
      <div className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 group flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-300 hover:scale-[1.03] sm:p-5">
        <div className="bg-editorial-3 relative mb-3 h-16 w-16 overflow-hidden rounded-full">
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
              <Icon icon="mdi:shield-account" className="text-editorial-muted h-8 w-8" />
            </div>
          )}
        </div>
        <h3 className="line-clamp-1 text-sm font-bold text-white">{team.name}</h3>
        {team.acronym && <span className="text-editorial-muted text-xs">{team.acronym}</span>}
        {team.game && <span className="text-editorial-accent mt-1 text-xs">{team.game}</span>}
        {team.location && (
          <span className="text-editorial-muted mt-0.5 flex items-center gap-1 text-xs">
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
        <div key={i} className="border-editorial-line bg-editorial-2 flex flex-col items-center rounded-2xl border p-5">
          <div className="mb-3 h-16 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mb-1 h-4 w-20 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-12 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}
