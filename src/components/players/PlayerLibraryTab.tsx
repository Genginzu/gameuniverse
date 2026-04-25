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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Icon icon="lucide:gamepad-2" className="h-6 w-6 text-blue-500 dark:text-blue-400" />
          {t("details.library")}
        </h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-slate-700/50 dark:text-slate-300">
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
            className="inline-flex items-center gap-2 rounded-xl bg-white/60 px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700/60"
          >
            {isLoadingMore ? (
              <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon="lucide:chevron-down" className="h-4 w-4" />
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
