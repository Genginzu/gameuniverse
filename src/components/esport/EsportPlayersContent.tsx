"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { Pagination } from "@/components/shared/Pagination";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useEsportGameOptions } from "@/hooks/useEsportGameOptions";
import { useListingQuery } from "@/hooks/useListingQuery";
import { esportPlayersListing } from "@/lib/listing/resources/esport";
import { getGameIcon } from "@/lib/utils/esport-utils";
import { EsportPlayerCard, type EsportPlayerCardData } from "./EsportPlayerCard";
import { PlayersSkeleton, PlayersToolbar } from "./EsportPlayersToolbar";

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

export function EsportPlayersContent({ initialData }: EsportPlayersContentProps) {
  const t = useTranslations("esport.players");
  const [search, setSearch] = useState("");
  const games = useEsportGameOptions("players");
  const { filters, setFilters, page, setPage, data, isLoading } = useListingQuery(
    esportPlayersListing,
    { fallbackData: initialData }
  );
  const applySearch = useDebouncedCallback((value: string) => setFilters({ search: value }), 300);

  const selectedGame = filters.game;
  const players = data?.players ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 25;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    applySearch(e.target.value);
  };

  const handleGameFilter = (game: string) =>
    setFilters({ game: selectedGame === game ? null : game });

  const showSkeleton = isLoading && players.length === 0;
  const isFiltered = Boolean(selectedGame || filters.search);

  return (
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
            onClick={() => setFilters({ game: null })}
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
                onPageChange={setPage}
                loading={isLoading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
