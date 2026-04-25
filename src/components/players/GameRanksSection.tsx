"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";

interface GameRank {
  game: string;
  gameSlug: string;
  tier: string;
  rank: string;
  points: number | null;
  iconUrl: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GAME_ICONS: Record<string, string> = {
  "league-of-legends": "simple-icons:leagueoflegends",
  valorant: "simple-icons:valorant",
  tft: "simple-icons:leagueoflegends",
  "overwatch-2": "simple-icons:overwatch",
  cs2: "simple-icons:counterstrike",
};

export function GameRanksSection({ playerId }: { playerId: string }) {
  const t = useTranslations("player.gameRanks");
  const { data, isLoading } = useSWR<{ ranks: GameRank[] }>(
    `/api/players/${playerId}/game-ranks`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const ranks = data?.ranks ?? [];

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="grid gap-3 xs:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (ranks.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white sm:text-base">
        <Icon icon="mdi:trophy-variant" className="h-5 w-5 text-palette-primary-500" />
        {t("title")}
      </h3>

      <div className="grid gap-3 xs:grid-cols-2">
        {ranks.map((rank) => (
          <div
            key={rank.gameSlug}
            className="flex items-center gap-3 rounded-xl bg-white/30 p-3 dark:bg-gray-800/30"
          >
            <Icon
              icon={GAME_ICONS[rank.gameSlug] ?? "mdi:gamepad-variant"}
              className="h-8 w-8 shrink-0 text-gray-600 dark:text-gray-300"
            />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">{rank.game}</p>
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                {rank.tier} {rank.rank}
              </p>
              {rank.points !== null && (
                <p className="text-xs text-palette-primary-500">
                  {rank.points} {t("points")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
