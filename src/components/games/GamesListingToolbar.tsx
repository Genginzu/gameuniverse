"use client";

import { useTranslations } from "next-intl";

import { FilterButton } from "@/components/shared/FilterButton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { GameSortMenu } from "@/components/games/GameSortMenu";
import type { GameListingSort } from "@/types/game";

interface GamesListingToolbarProps {
  totalCount: number;
  hasFilters: boolean;
  filterCount: number;
  onToggleFilters: () => void;
  sort: GameListingSort;
  onSortChange: (sort: GameListingSort) => void;
}

export function GamesListingToolbar({
  totalCount,
  hasFilters,
  filterCount,
  onToggleFilters,
  sort,
  onSortChange,
}: GamesListingToolbarProps) {
  const t = useTranslations("games");

  return (
    <>
      <header className="mb-10 flex flex-col gap-3">
        <KickerLabel>{t("listingKicker")}</KickerLabel>
        <h1 className="font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
          {t("listingTitle")}
        </h1>
        <p className="text-editorial-muted flex flex-wrap items-baseline gap-5 text-sm">
          <span>{t("listingDescription")}</span>
          <span>·</span>
          <span className="text-editorial-accent font-mono">
            {t("listingCount", { count: totalCount })}
          </span>
        </p>
      </header>

      <div className="mb-5 flex items-center justify-between gap-3">
        <FilterButton hasFilters={hasFilters} filterCount={filterCount} onClick={onToggleFilters} />
        <GameSortMenu value={sort} onChange={onSortChange} />
      </div>
    </>
  );
}
