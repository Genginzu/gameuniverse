"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface PlayersToolbarProps {
  search: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  total: number;
  isFiltered: boolean;
}

export function PlayersToolbar({ search, onSearch, total, isFiltered }: PlayersToolbarProps) {
  const t = useTranslations("esport.players");
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md">
        <Icon
          icon="mdi:magnify"
          className="text-editorial-muted absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
        />
        <input
          type="text"
          value={search}
          onChange={onSearch}
          placeholder={t("searchPlaceholder")}
          className="border-editorial-line bg-editorial-2 placeholder:text-editorial-muted w-full rounded-xl border py-2.5 pr-4 pl-10 text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
        />
      </div>

      {total > 0 && (
        <div className="text-editorial-muted text-sm">
          {isFiltered
            ? t("matchingPlayers", { count: total })
            : t("totalPlayers", { count: total })}
        </div>
      )}
    </div>
  );
}

export function PlayersSkeleton() {
  return (
    <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="border-editorial-line bg-editorial-2 flex flex-col items-center rounded-2xl border p-4 sm:p-5"
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
