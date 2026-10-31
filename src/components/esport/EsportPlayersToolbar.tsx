"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { FilterButton } from "@/components/shared/FilterButton";
import { KickerLabel } from "@/components/shared/KickerLabel";

interface PlayersToolbarProps {
  search: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  total: number;
  isFiltered: boolean;
  filterCount: number;
  onToggleFilters: () => void;
}

export function PlayersToolbar({
  search,
  onSearch,
  total,
  isFiltered,
  filterCount,
  onToggleFilters,
}: PlayersToolbarProps) {
  const t = useTranslations("esport.players");
  return (
    <>
      <header className="mb-10 flex flex-col gap-3">
        <KickerLabel>{t("listingKicker")}</KickerLabel>
        <h1 className="font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="text-editorial-muted flex flex-wrap items-baseline gap-5 text-sm">
          <span>{t("subtitle")}</span>
          <span aria-hidden>·</span>
          <span className="text-editorial-accent font-mono">
            {isFiltered
              ? t("matchingPlayers", { count: total })
              : t("totalPlayers", { count: total })}
          </span>
        </p>
      </header>

      <div className="mb-5 flex items-center justify-between gap-3">
        <FilterButton
          hasFilters={filterCount > 0}
          filterCount={filterCount}
          onClick={onToggleFilters}
        />
        <div className="relative w-full max-w-md">
          <Icon
            icon="mdi:magnify"
            className="text-editorial-muted absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={onSearch}
            placeholder={t("searchPlaceholder")}
            className="border-editorial-line bg-editorial-2 placeholder:text-editorial-muted h-12 w-full rounded-xl border pr-4 pl-10 text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))] sm:h-14"
          />
        </div>
      </div>
    </>
  );
}

export function PlayersSkeleton() {
  return (
    <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="border-editorial-line bg-editorial-2 flex min-h-[218px] flex-col items-center rounded-2xl border p-4 sm:min-h-[226px] sm:p-5"
        >
          <div className="mb-3 h-20 w-20 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mb-2 h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
          <div className="mb-2 h-5 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mb-1 h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}
