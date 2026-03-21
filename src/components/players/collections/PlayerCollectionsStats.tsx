"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { PlayerCollectionsStatsData } from "@/types/playerCollection";

interface PlayerCollectionsStatsProps {
  stats: PlayerCollectionsStatsData | null;
}

export function PlayerCollectionsStats({ stats }: PlayerCollectionsStatsProps) {
  const t = useTranslations("players.collectionsTab");

  if (!stats) return null;

  const metrics = [
    {
      icon: "lucide:library",
      label: t("stats.totalCollections"),
      value: stats.totalCollections,
      iconBg: "bg-neon-violet/20",
      iconColor: "text-neon-violet",
    },
    {
      icon: "lucide:gamepad-2",
      label: t("stats.totalGames"),
      value: stats.totalGames,
      iconBg: "bg-neon-cyan/20",
      iconColor: "text-neon-cyan",
    },
    {
      icon: "lucide:trophy",
      label: t("stats.largestCollection"),
      value: stats.largestCollection ?? "—",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="glass-card flex items-center gap-3 rounded-xl p-4 transition-all duration-300"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.iconBg} ${metric.iconColor}`}
          >
            <Icon icon={metric.icon} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500 dark:text-slate-400">{metric.label}</p>
            <p className="truncate text-xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
