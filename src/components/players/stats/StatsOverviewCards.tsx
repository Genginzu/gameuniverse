"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { OverviewMetrics } from "@/types/dashboard-stats";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import type { ReactNode } from "react";

interface StatsOverviewCardsProps {
  metrics: OverviewMetrics;
  locale: string;
}

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  iconColorClass: string;
}

function MetricCard({ icon, label, value, iconColorClass }: MetricCardProps) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-4 transition-all duration-300">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export function StatsOverviewCards({ metrics, locale }: StatsOverviewCardsProps) {
  const t = useTranslations("playerStats");

  if (metrics.totalGames === 0) {
    return (
      <StatsEmptyState
        icon={<Icon icon="lucide:bar-chart-3" className="h-8 w-8" />}
        message={t("overview.empty")}
      />
    );
  }

  const formattedRating = metrics.averageRating !== null ? metrics.averageRating.toFixed(1) : "—";

  const cards = [
    {
      icon: <Icon icon="lucide:gamepad-2" className="h-5 w-5" />,
      label: t("overview.totalGames"),
      value: formatLocalizedNumber(metrics.totalGames, locale),
      iconColorClass: "bg-neon-primary/20 text-neon-primary",
    },
    {
      icon: <Icon icon="lucide:clock" className="h-5 w-5" />,
      label: t("overview.totalPlayTime"),
      value: `${formatLocalizedNumber(metrics.totalPlayTimeHours, locale)}h`,
      iconColorClass: "bg-neon-secondary/20 text-neon-secondary",
    },
    {
      icon: <Icon icon="lucide:message-square" className="h-5 w-5" />,
      label: t("overview.reviews"),
      value: formatLocalizedNumber(metrics.reviewCount, locale),
      iconColorClass: "bg-neon-primary/20 text-neon-primary",
    },
    {
      icon: <Icon icon="lucide:star" className="h-5 w-5" />,
      label: t("overview.averageRating"),
      value: formattedRating,
      iconColorClass: "bg-neon-secondary/20 text-neon-secondary",
    },
    {
      icon: <Icon icon="lucide:folder-open" className="h-5 w-5" />,
      label: t("overview.collections"),
      value: formatLocalizedNumber(metrics.collectionsCount, locale),
      iconColorClass: "bg-neon-primary/20 text-neon-primary",
    },
    {
      icon: <Icon icon="lucide:users" className="h-5 w-5" />,
      label: t("overview.friends"),
      value: formatLocalizedNumber(metrics.friendsCount, locale),
      iconColorClass: "bg-neon-secondary/20 text-neon-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
