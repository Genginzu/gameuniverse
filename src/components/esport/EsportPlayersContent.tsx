"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getGameIcon } from "@/lib/utils/esport-utils";
import { EsportPlayerCard, type EsportPlayerCardData } from "./EsportPlayerCard";

interface PlayerSummary extends EsportPlayerCardData {
  slug: string;
  firstName: string | null;
  lastName: string | null;
}

export interface EsportPlayersData {
  players: PlayerSummary[];
}

interface EsportPlayersContentProps {
  initialData?: EsportPlayersData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportPlayersContent({ initialData }: EsportPlayersContentProps) {
  const t = useTranslations("esport.players");
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  // Available games for filters (reuses the tournaments aggregator)
  const { data: gamesData } = useSWR<{ games: string[] }>(
    "/api/esport/tournaments?games_only=true",
    fetcher,
    { revalidateOnFocus: false }
  );

  const playersUrl = useMemo(() => {
    if (debouncedSearch) {
      return `/api/esport/players?search=${encodeURIComponent(debouncedSearch)}`;
    }
    return "/api/esport/players";
  }, [debouncedSearch]);

  // initialData is only valid for the unsearched view
  const fallbackData = !debouncedSearch ? initialData : undefined;

  const { data, isLoading } = useSWR<EsportPlayersData>(playersUrl, fetcher, {
    fallbackData,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const allPlayers = data?.players ?? [];
  const games = gamesData?.games ?? [];

  // Client-side game filtering — the /players endpoint doesn't reliably filter
  // by game, and the dataset is small enough to filter in memory.
  const players = useMemo(() => {
    if (!selectedGame) return allPlayers;
    const target = selectedGame.toLowerCase();
    return allPlayers.filter((p) => p.game?.toLowerCase() === target);
  }, [allPlayers, selectedGame]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleGameFilter = useCallback(
    (game: string) => setSelectedGame((prev) => (prev === game ? null : game)),
    []
  );

  const totalCount = allPlayers.length;
  const filteredCount = players.length;
  const isFiltered = Boolean(selectedGame || debouncedSearch);
  const showSkeleton = isLoading && allPlayers.length === 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <PlayersToolbar
          search={search}
          onSearch={handleSearch}
          totalCount={totalCount}
          filteredCount={filteredCount}
          isFiltered={isFiltered}
        />

        {games.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <FilterChip
              label={t("allGames")}
              selected={selectedGame === null}
              onClick={() => setSelectedGame(null)}
            />
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

        {showSkeleton ? (
          <PlayersSkeleton />
        ) : players.length === 0 ? (
          <EmptyState
            icon="mdi:account-search"
            title={t("noPlayers")}
            description={t("noPlayersDescription")}
          />
        ) : (
          <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {players.map((player) => (
              <EsportPlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PlayersToolbarProps {
  search: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalCount: number;
  filteredCount: number;
  isFiltered: boolean;
}

function PlayersToolbar({
  search,
  onSearch,
  totalCount,
  filteredCount,
  isFiltered,
}: PlayersToolbarProps) {
  const t = useTranslations("esport.players");
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md">
        <Icon
          icon="mdi:magnify"
          className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={onSearch}
          placeholder={t("searchPlaceholder")}
          className="glass-input w-full rounded-xl py-2.5 pr-4 pl-10 text-base"
        />
      </div>

      {totalCount > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {isFiltered && filteredCount !== totalCount
            ? t("showingPlayers", { shown: filteredCount, total: totalCount })
            : t("totalPlayers", { count: totalCount })}
        </div>
      )}
    </div>
  );
}

function PlayersSkeleton() {
  return (
    <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="glass-card flex flex-col items-center rounded-2xl p-4 sm:p-5">
          <Skeleton className="mb-3 h-20 w-20 rounded-full" />
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="mb-2 h-5 w-16 rounded-full" />
          <Skeleton className="mb-1 h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
