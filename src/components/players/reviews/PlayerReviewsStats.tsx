"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { PlayerReviewsStatsData } from "@/types/playerReview";
import { getRatingColor } from "@/lib/utils/ratingColor";

interface PlayerReviewsStatsProps {
  stats: PlayerReviewsStatsData;
}

/** Bar accent colors per distribution range (top-down: best to lowest) */
const BAR_COLORS = ["bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"] as const;

export function PlayerReviewsStats({ stats }: PlayerReviewsStatsProps) {
  const t = useTranslations("players.reviews");

  const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1);

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      {/* Metrics row */}
      <div className="mb-6 flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
        {/* Total reviews — aligned left */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-neon-violet/20 text-neon-violet flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10">
            <Icon icon="lucide:message-square" className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500 sm:text-sm dark:text-slate-400">
              {t("stats.totalReviews")}
            </p>
            <p className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
              {stats.totalCount}
            </p>
          </div>
        </div>

        {/* Average rating — staggered right on mobile */}
        <div className="flex items-center gap-2 self-end sm:gap-3 sm:self-auto">
          <div className="bg-neon-cyan/20 text-neon-cyan flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10">
            <Icon icon="lucide:star" className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500 sm:text-sm dark:text-slate-400">
              {t("stats.averageRating")}
            </p>
            {stats.averageRating !== null ? (
              <p className="text-xl font-bold sm:text-2xl">
                <span className={getRatingColor(stats.averageRating)}>
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm font-normal text-gray-400 sm:text-base dark:text-slate-500">
                  /20
                </span>
              </p>
            ) : (
              <p className="text-xs text-gray-400 sm:text-sm dark:text-slate-500">
                {t("stats.noRating")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Icon icon="lucide:bar-chart-3" className="h-4 w-4 text-gray-500 dark:text-slate-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {t("stats.distribution")}
          </p>
        </div>

        <div className="space-y-2">
          {/* Reverse so highest range (16-20) appears first */}
          {[...stats.distribution].reverse().map((bucket, index) => (
            <div key={bucket.range} className="flex items-center gap-3">
              <span className="w-12 text-right text-xs font-medium text-gray-600 dark:text-slate-400">
                {bucket.range}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-gray-200/60 dark:bg-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[index]}`}
                  style={{
                    width: `${Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              <span className="w-20 text-right text-xs text-gray-500 dark:text-slate-400">
                {bucket.count} ({bucket.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
