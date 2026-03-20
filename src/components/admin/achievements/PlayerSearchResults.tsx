"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import type { PlayerSearchResult } from "@/types/admin-achievements";
import { Icon } from "@iconify/react";

export interface PlayerSearchResultsProps {
  players: PlayerSearchResult[];
  searchLoading: boolean;
  hasQuery: boolean;
  onSelect: (player: PlayerSearchResult) => void;
}

export function PlayerSearchResults({
  players,
  searchLoading,
  hasQuery,
  onSelect,
}: PlayerSearchResultsProps) {
  const t = useTranslations("adminAchievements.playerManager");

  if (searchLoading) {
    return (
      <div className="mt-4 flex justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (hasQuery && players.length === 0) {
    return <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t("noPlayersFound")}</p>;
  }

  if (players.length === 0) return null;

  return (
    <ul className="mt-4 space-y-2">
      {players.map((player) => (
        <li key={player.id}>
          <button
            type="button"
            onClick={() => onSelect(player)}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-700/60"
          >
            {player.avatarUrl ? (
              <Image
                src={player.avatarUrl}
                alt={player.username}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <Icon icon="fa:user" className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <span className="font-medium text-gray-900 dark:text-white">{player.username}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
