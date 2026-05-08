"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlayerStats as PlayerStatsType } from "@/lib/services/esportPlayerHistoryService";

interface PlayerStatsProps {
  stats: PlayerStatsType | undefined;
  isLoading: boolean;
}

/**
 * Stat cards displayed on the player profile: wins, losses, win rate and
 * the count of distinct teams the player has been on.
 *
 * Hidden when the player has no recorded matches at all (zero state on
 * a fresh DB before the team history backfill).
 */
export function PlayerStats({ stats, isLoading }: PlayerStatsProps) {
  const t = useTranslations("esport.players.stats");

  if (isLoading) {
    return (
      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!stats || stats.totalMatches === 0) {
    return null;
  }

  const winRatePct = Math.round(stats.winRate * 100);

  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Icon icon="mdi:chart-box" className="text-palette-primary-500 h-5 w-5" />
        {t("heading")}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon="mdi:trophy"
          label={t("wins")}
          value={stats.wins}
          tone="positive"
        />
        <StatTile
          icon="mdi:close-circle-outline"
          label={t("losses")}
          value={stats.losses}
          tone="negative"
        />
        <StatTile
          icon="mdi:percent"
          label={t("winRate")}
          value={`${winRatePct}%`}
          tone="primary"
        />
        <StatTile
          icon="mdi:shield-account"
          label={t("teamsCount")}
          value={stats.teamsCount}
          tone="neutral"
        />
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {t("totalMatches", { count: stats.totalMatches })}
      </p>
    </section>
  );
}

interface StatTileProps {
  icon: string;
  label: string;
  value: string | number;
  tone: "positive" | "negative" | "primary" | "neutral";
}

function StatTile({ icon, label, value, tone }: StatTileProps) {
  const toneClasses: Record<StatTileProps["tone"], string> = {
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
    primary: "text-palette-primary-600 dark:text-palette-primary-400",
    neutral: "text-gray-700 dark:text-gray-300",
  };

  return (
    <div className="rounded-xl bg-white/60 p-3 text-center dark:bg-gray-800/40">
      <Icon icon={icon} className={`mx-auto mb-1 h-5 w-5 ${toneClasses[tone]}`} />
      <p className={`text-xl font-bold ${toneClasses[tone]}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
