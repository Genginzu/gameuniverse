"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { PlaytimeGameEntry } from "@/types/dashboard-stats";
import Image from "next/image";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";

interface TopGamesPlaytimeProps {
  games: PlaytimeGameEntry[];
  locale: string;
}

export function TopGamesPlaytime({ games, locale }: TopGamesPlaytimeProps) {
  const t = useTranslations("playerStats");

  if (games.length === 0) return null;

  /* Le max sert de référence pour la largeur des barres */
  const maxHours = games[0].playTimeHours;

  return (
    <div className="glass-card flex flex-1 flex-col rounded-xl p-5 transition-all duration-300">
      <p className="mb-3 text-sm font-medium text-gray-500 dark:text-slate-400">
        {t("playtime.topGames")}
      </p>
      <div className="flex flex-col gap-3">
        {games.map((game, index) => {
          const ratio = maxHours > 0 ? (game.playTimeHours / maxHours) * 100 : 0;
          return (
            <div key={game.id} className="flex items-center gap-3">
              {/* Rang */}
              <span className="w-4 shrink-0 text-xs font-bold text-gray-400 dark:text-slate-500">
                {index + 1}
              </span>
              {/* Cover */}
              <div className="h-10 w-7 shrink-0 overflow-hidden rounded-md">
                {game.coverImage ? (
                  <Image
                    src={game.coverImage}
                    alt={game.title}
                    width={28}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                    <Icon
                      icon="lucide:gamepad-2"
                      className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500"
                    />
                  </div>
                )}
              </div>
              {/* Title + bar */}
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate text-xs font-medium text-gray-900 dark:text-white">
                  {game.title}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-slate-700/60">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-palette-primary-500 to-palette-secondary-500 transition-all duration-700"
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
              {/* Hours */}
              <span className="shrink-0 text-xs font-semibold text-gray-600 dark:text-slate-300">
                {formatLocalizedNumber(game.playTimeHours, locale)}
                <span className="ml-0.5 font-normal text-gray-400 dark:text-slate-500">h</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
