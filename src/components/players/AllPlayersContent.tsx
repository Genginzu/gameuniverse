"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PlayerCard } from "./PlayerCard";
import { SearchBar } from "@/components/shared/SearchBar";
import { PlayerFilters } from "./PlayerFilters";
import { FilterButton } from "@/components/shared/FilterButton";
import { Pagination } from "@/components/shared/Pagination";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { playerSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePlayersList } from "@/hooks/usePlayersList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function AllPlayersContent() {
  const t = useTranslations("players");
  const tNav = useTranslations("navigation");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGameCounts, setSelectedGameCounts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const { players, pagination, loading, initialLoading } = usePlayersList(
    debouncedSearch,
    selectedGameCounts,
    page
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleGameCountFilter = useCallback((counts: string[]) => {
    setSelectedGameCounts(counts);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGameCounts([]);
    setPage(1);
  }, []);

  const hasFilters = searchQuery.length > 0 || selectedGameCounts.length > 0;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50 to-violet-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <GridSkeleton skeletonConfig={playerSkeletonConfig} count={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50 to-violet-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {tNav("players")}
        </h1>

        <div className="mb-6 space-y-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                initialValue={searchQuery}
                placeholder={t("searchPlaceholder")}
                showSearchIndicator
                searchIndicatorText={t("searchingFor")}
              />
            </div>
            <div className="shrink-0">
              <FilterButton
                hasFilters={selectedGameCounts.length > 0}
                filterCount={selectedGameCounts.length}
                onClick={() => setShowFilters(!showFilters)}
              />
            </div>
          </div>

          <PlayerFilters
            selectedGameCounts={selectedGameCounts}
            onGameCountChange={handleGameCountFilter}
            onClearFilters={handleClearFilters}
            showAllFilters={showFilters}
          />
        </div>

        {loading && !initialLoading && (
          <GridSkeleton skeletonConfig={playerSkeletonConfig} count={20} />
        )}

        {!loading && (
          <>
            {players.length === 0 ? (
              <EmptyState
                icon="mdi:account-group-outline"
                title={t("empty.title")}
                description={hasFilters ? t("empty.description") : t("empty.noPlayers")}
                action={
                  hasFilters
                    ? { label: t("empty.clearFilters"), onClick: handleClearFilters }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {players.map((player, index) => (
                    <PlayerCard key={player.id} player={player} priority={index < 4} />
                  ))}
                </div>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 sm:mt-12">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                  loading={loading}
                  translationNamespace="players.pagination"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
