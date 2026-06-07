"use client";

import { useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { PlayerLibraryGrid } from "./PlayerLibraryGrid";
import type { PlayerDetails, PlayerLibraryGame } from "@/types/player";

interface PlayerLibraryTabProps {
  player: PlayerDetails;
  locale: string;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function PlayerLibraryTab({ player, locale, t, tCommon }: PlayerLibraryTabProps) {
  const [games, setGames] = useState<PlayerLibraryGame[]>(player.library);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const totalCount = player.libraryTotalCount;
  const hasMore = games.length < totalCount;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = Math.floor(games.length / 30) + 2;
      const res = await fetch(
        `/api/players/${player.id}/library?page=${nextPage}&limit=30&locale=${locale}`
      );
      if (res.ok) {
        const json = await res.json();
        setGames((prev) => [...prev, ...json.games]);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [games.length, hasMore, isLoadingMore, player.id, locale]);

  return (
    <div className="mb-8">
      <div className="border-editorial-line mb-6 flex items-center justify-between gap-4 border-b pb-4">
        <h2 className="font-display flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
          <Icon
            icon="lucide:gamepad-2"
            className="text-editorial-accent h-6 w-6"
            aria-hidden="true"
          />
          {t("details.library")}
        </h2>
        <span className="bg-editorial-accent/12 text-editorial-accent inline-flex items-center rounded-full border border-[rgba(var(--accent-rgb,var(--neon-primary)),0.25)] px-3 py-1 font-mono text-[0.7rem] font-semibold tracking-[0.1em] whitespace-nowrap uppercase">
          {totalCount} {tCommon("games")} {t("details.inLibrary")}
        </span>
      </div>
      <PlayerLibraryGrid games={games} locale={locale} />
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="bg-editorial-3 border-editorial-line inline-flex h-11 items-center gap-2 rounded-xl border px-6 text-sm font-medium text-white transition hover:not-disabled:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.4)] hover:not-disabled:text-[rgb(var(--accent-rgb,var(--neon-primary)))] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingMore ? (
              <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Icon icon="lucide:chevron-down" className="h-4 w-4" aria-hidden="true" />
            )}
            {isLoadingMore
              ? t("details.loadingMore")
              : `${t("details.showMore")} (${games.length}/${totalCount})`}
          </button>
        </div>
      )}
    </div>
  );
}
