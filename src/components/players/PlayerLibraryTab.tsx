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
    <div className="editorial-player-library mb-8">
      <div className="editorial-player-library-header">
        <h2 className="editorial-player-library-title">
          <Icon
            icon="lucide:gamepad-2"
            className="editorial-player-library-icon"
            aria-hidden="true"
          />
          {t("details.library")}
        </h2>
        <span className="editorial-player-library-count">
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
            className="editorial-player-library-load-more"
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
