"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { PlatformDistributionEntry } from "@/types/dashboard-stats";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";

const BAR_COLORS = [
  "from-[#615dfa] to-[#7c5cfc]", // violet gradient
  "from-palette-secondary-500 to-palette-secondary-400",
  "from-blue-500 to-blue-400",
  "from-purple-500 to-purple-400",
  "from-pink-500 to-pink-400",
  "from-gray-500 to-gray-400",
];

interface PlatformDistributionChartProps {
  distribution: PlatformDistributionEntry[];
  locale: string;
}

export function PlatformDistributionChart({
  distribution,
  locale: _locale,
}: PlatformDistributionChartProps) {
  const t = useTranslations("playerStats");

  if (distribution.length === 0) {
    return (
      <div>
        <StatsSectionTitle>{t("platformDistribution.title")}</StatsSectionTitle>
        <StatsEmptyState
          icon={<Icon icon="lucide:monitor" className="h-8 w-8" />}
          message={t("platformDistribution.empty")}
        />
      </div>
    );
  }

  const maxCount = Math.max(...distribution.map((e) => e.count));

  return (
    <div>
      <StatsSectionTitle>{t("platformDistribution.title")}</StatsSectionTitle>
      <div className="glass-card rounded-xl p-6 transition-all duration-300">
        <div className="space-y-4">
          {distribution.map((entry, index) => (
            <div key={entry.platform} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {entry.platform}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {entry.count} — {entry.percentage}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-slate-700/60">
                <div
                  className={`h-full rounded-full bg-linear-to-r ${BAR_COLORS[index % BAR_COLORS.length]} transition-all duration-500`}
                  style={{ width: `${maxCount > 0 ? (entry.count / maxCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
