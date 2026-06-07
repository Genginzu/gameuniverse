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
    <div className="editorial-reviews-stats">
      {/* Metrics row */}
      <div className="editorial-reviews-stats-metrics">
        {/* Total reviews */}
        <div className="editorial-reviews-stats-metric">
          <div className="editorial-reviews-stats-metric-icon">
            <Icon icon="lucide:message-square" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="editorial-reviews-stats-metric-label">{t("stats.totalReviews")}</p>
            <p className="editorial-reviews-stats-metric-value">{stats.totalCount}</p>
          </div>
        </div>

        {/* Average rating */}
        <div className="editorial-reviews-stats-metric">
          <div className="editorial-reviews-stats-metric-icon">
            <Icon icon="lucide:star" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="editorial-reviews-stats-metric-label">{t("stats.averageRating")}</p>
            {stats.averageRating !== null ? (
              <p className="editorial-reviews-stats-metric-value">
                <span className={getRatingColor(stats.averageRating)}>
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="editorial-reviews-stats-metric-unit">/20</span>
              </p>
            ) : (
              <p className="editorial-reviews-stats-metric-empty">{t("stats.noRating")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="editorial-reviews-stats-distribution">
        <div className="editorial-reviews-stats-distribution-header">
          <Icon icon="lucide:bar-chart-3" className="h-4 w-4" aria-hidden="true" />
          <p>{t("stats.distribution")}</p>
        </div>

        <div className="space-y-2">
          {/* Reverse so highest range (16-20) appears first */}
          {[...stats.distribution].reverse().map((bucket, index) => (
            <div key={bucket.range} className="editorial-reviews-stats-bar-row">
              <span className="editorial-reviews-stats-bar-range">{bucket.range}</span>
              <div className="editorial-reviews-stats-bar-track">
                <div
                  className={`editorial-reviews-stats-bar-fill ${BAR_COLORS[index]}`}
                  style={{
                    width: `${Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              <span className="editorial-reviews-stats-bar-count">
                {bucket.count} ({bucket.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
