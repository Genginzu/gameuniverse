"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { Pagination } from "@/components/shared/Pagination";
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
  total: number;
  page: number;
  limit: number;
}

interface EsportPlayersContentProps {
  initialData?: EsportPlayersData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportPlayersContent({ initialData }: EsportPlayersContentProps) {
  const t = useTranslations("esport.players");
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  // Available games for the filter chips, sourced from the players table.
  const { data: gamesData } = useSWR<{ games: string[] }>(
    "/api/esport/players?games_only=true",
    fetcher,
    { revalidateOnFocus: false }
  );

  // Reset to page 1 whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedGame]);

  const playersUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedGame) params.set("game", selectedGame);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/api/esport/players?${qs}` : "/api/esport/players";
  }, [debouncedSearch, selectedGame, page]);

  // initialData is only valid for the unfiltered, unsearched, first-page view.
  const fallbackData =
    !debouncedSearch && !selectedGame && page === 1 ? initialData : undefined;

  const { data, isLoading } = useSWR<EsportPlayersData>(playersUrl, fetcher, {
    fallbackData,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const players = data?.players ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 24;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
  const games = gamesData?.games ?? [];

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleGameFilter = useCallback(
    (game: string) => setSelectedGame((prev) => (prev === game ? null : game)),
    []
  );

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const showSkeleton = isLoading && players.length === 0;
  const isFiltered = Boolean(selectedGame || debouncedSearch);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <PlayersToolbar
          search={search}
          onSearch={handleSearch}
          total={total}
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
          <>
            <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {players.map((player) => (
                <EsportPlayerCard key={player.id} player={player} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalCount={total}
                  onPageChange={handlePageChange}
                  loading={isLoading}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface PlayersToolbarProps {
  search: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  total: number;
  isFiltered: boolean;
}

function PlayersToolbar({ search, onSearch, total, isFiltered }: PlayersToolbarProps) {
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

      {total > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {isFiltered
            ? t("matchingPlayers", { count: total })
            : t("totalPlayers", { count: total })}
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
