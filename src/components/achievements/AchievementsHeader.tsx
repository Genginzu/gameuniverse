"use client";

import { useTranslations } from "next-intl";
import { Trophy, Zap, TrendingUp } from "lucide-react";
import type { PlayerAchievementWithDetails, PlayerXpStats } from "@/types/achievement";

interface AchievementsHeaderProps {
  achievements: PlayerAchievementWithDetails[];
  xpStats: PlayerXpStats | null;
}

export function AchievementsHeader({ achievements, xpStats }: AchievementsHeaderProps) {
  const t = useTranslations("achievements");

  const totalCount = achievements.length;
  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;

  const level = xpStats?.level ?? 1;
  const xpTotal = xpStats?.xpTotal ?? 0;
  const progressPercent = xpStats?.progressPercent ?? 0;

  const stats = [
    {
      icon: Trophy,
      label: t("stats.unlocked", { count: unlockedCount, total: totalCount }),
      value: null,
    },
    {
      icon: Zap,
      label: t("stats.xpTotal"),
      value: xpTotal.toLocaleString(),
    },
    {
      icon: TrendingUp,
      label: t("stats.level", { level }),
      value: t("stats.progress", { percent: Math.round(progressPercent) }),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("pageTitle")}</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card flex items-center gap-3 rounded-xl p-4 transition-all duration-300"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 text-white">
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {stat.label}
              </p>
              {stat.value && (
                <p className="text-xs text-gray-500 dark:text-slate-400">{stat.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
