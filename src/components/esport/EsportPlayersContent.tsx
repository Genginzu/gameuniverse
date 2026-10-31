"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { Pagination } from "@/components/shared/Pagination";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useEsportGameOptions } from "@/hooks/useEsportGameOptions";
import { useListingQuery } from "@/hooks/useListingQuery";
import { esportPlayersListing } from "@/lib/listing/resources/esport";
import { EsportPlayerCard, type EsportPlayerCardData } from "./EsportPlayerCard";
import { EsportPlayersFilters } from "./EsportPlayersFilters";
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
  const [showFilters, setShowFilters] = useState(false);
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

  const showSkeleton = isLoading && players.length === 0;
  const isFiltered = Boolean(selectedGame || filters.search);

  return (
    <EditorialContainer>
      <PlayersToolbar
        search={search}
        onSearch={handleSearch}
        total={total}
        isFiltered={isFiltered}
        filterCount={selectedGame ? 1 : 0}
        onToggleFilters={() => setShowFilters((visible) => !visible)}
      />

      <EsportPlayersFilters
        games={games}
        selectedGame={selectedGame}
        onGameChange={(game) => setFilters({ game })}
        showPanel={showFilters}
      />

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
                variant="editorial"
              />
            </div>
          )}
        </>
      )}
    </EditorialContainer>
  );
}
