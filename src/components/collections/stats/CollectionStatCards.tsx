"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { CollectionAdvancedStats } from "@/types/playerCollection";
import { formatPlayTime } from "@/lib/utils/formatPlayTime";

interface CollectionStatCardsProps {
  stats: CollectionAdvancedStats;
}

/** Extra metric cards: average rating, total playtime, completion rate. */
export function CollectionStatCards({ stats }: CollectionStatCardsProps) {
  const t = useTranslations("collections.stats");
  const locale = useLocale();

  const cards = [
    {
      icon: "lucide:star",
      label: t("averageRating"),
      value: stats.averageRating !== null ? `${stats.averageRating}/100` : "—",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-500",
    },
    {
      icon: "lucide:clock",
      label: t("totalPlaytime"),
      value: t("hoursValue", { hours: formatPlayTime(stats.totalPlaytimeHours, locale) }),
      iconBg: "bg-neon-secondary/20",
      iconColor: "text-neon-secondary",
    },
    {
      icon: "lucide:circle-check-big",
      label: t("completionRate"),
      value: `${stats.completionRate}%`,
      sub: t("completedCount", { completed: stats.completedGames, total: stats.totalGames }),
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card flex items-center gap-3 rounded-xl p-4 transition-all duration-300"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
          >
            <Icon icon={card.icon} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-600 dark:text-slate-300">{card.label}</p>
            <p className="truncate text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            {card.sub && (
              <p className="truncate text-xs text-gray-500 dark:text-slate-400">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
