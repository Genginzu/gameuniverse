"use client";

import { useTranslations } from "next-intl";
import { BarChart3, Star, MessageSquare } from "lucide-react";
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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Total reviews */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-violet/20 text-neon-violet">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t("stats.totalReviews")}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCount}</p>
          </div>
        </div>

        {/* Average rating */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-cyan/20 text-neon-cyan">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t("stats.averageRating")}</p>
            {stats.averageRating !== null ? (
              <p className="text-2xl font-bold">
                <span className={getRatingColor(stats.averageRating)}>
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-base font-normal text-gray-400 dark:text-slate-500">/20</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-slate-500">{t("stats.noRating")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-500 dark:text-slate-400" />
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
