"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { PlatformDistributionEntry } from "@/types/dashboard-stats";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";
import { chartColor } from "@/lib/utils/chart-colors";

const TOP_PLATFORMS_LIMIT = 5;

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

  const topPlatforms = distribution.slice(0, TOP_PLATFORMS_LIMIT);
  const maxCount = Math.max(...topPlatforms.map((e) => e.count));

  return (
    <div className="flex h-full flex-col">
      <StatsSectionTitle>{t("platformDistribution.title")}</StatsSectionTitle>
      <div className="glass-card flex-1 rounded-lg p-6 transition-all duration-300">
        <ol className="space-y-4">
          {topPlatforms.map((entry, index) => (
            <li key={entry.platform} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <span className="text-editorial-muted w-5 shrink-0 font-display tabular-nums">
                    {index + 1}
                  </span>
                  <span className="truncate">{entry.platform}</span>
                </span>
                <span className="shrink-0 text-xs text-gray-500 dark:text-slate-400">
                  {entry.count} — {entry.percentage}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-slate-700/60">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${maxCount > 0 ? (entry.count / maxCount) * 100 : 0}%`,
                    backgroundColor: chartColor(index),
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
