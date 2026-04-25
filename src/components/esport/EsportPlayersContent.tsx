"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageBanner } from "@/components/shared/PageBanner";
import { Link } from "@/i18n/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LazyImage } from "@/components/ui/lazy-image";

interface PlayerSummary {
  id: number;
  name: string;
  slug: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  imageUrl: string | null;
  role: string | null;
  teamName: string | null;
  game: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportPlayersContent() {
  const t = useTranslations("esport.players");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const url = debouncedSearch
    ? `/api/esport/players?search=${encodeURIComponent(debouncedSearch)}`
    : "/api/esport/players";

  const { data, isLoading } = useSWR<{ players: PlayerSummary[] }>(url, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const players = data?.players ?? [];

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <PageBanner title={t("title")} subtitle={t("subtitle")} icon="mdi:account-star" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder={t("searchPlaceholder")}
              className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-base"
            />
          </div>
        </div>

        {isLoading && players.length === 0 ? (
          <PlayersSkeleton />
        ) : players.length === 0 ? (
          <EmptyState
            icon="mdi:account-search"
            title={t("noPlayers")}
            description={t("noPlayersDescription")}
          />
        ) : (
          <div className="grid gap-4 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerSummary }) {
  return (
    <Link href={`/esport/players/${player.id}`}>
      <div className="glass-card group flex flex-col items-center rounded-2xl p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg sm:p-5">
        <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          {player.imageUrl ? (
            <LazyImage src={player.imageUrl} alt={player.name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon icon="mdi:account" className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <h3 className="line-clamp-1 text-sm font-bold text-gray-900 dark:text-white">{player.name}</h3>
        {player.role && <span className="text-xs text-gray-500 dark:text-gray-400">{player.role}</span>}
        {player.teamName && (
          <span className="mt-1 text-xs text-palette-primary-500">{player.teamName}</span>
        )}
        {player.nationality && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
            <Icon icon="mdi:flag" className="h-3 w-3" />
            {player.nationality}
          </span>
        )}
      </div>
    </Link>
  );
}

function PlayersSkeleton() {
  return (
    <div className="grid gap-4 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="glass-card flex flex-col items-center rounded-2xl p-5">
          <Skeleton className="mb-3 h-16 w-16 rounded-full" />
          <Skeleton className="mb-1 h-4 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}
