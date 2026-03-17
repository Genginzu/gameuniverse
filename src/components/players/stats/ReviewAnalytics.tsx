"use client";

import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ReviewAnalyticsData, ReviewBucket } from "@/types/dashboard-stats";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";
import { ReviewMetricsRadial } from "./review-variants/ReviewMetricsRadial";

interface ReviewAnalyticsProps {
  analytics: ReviewAnalyticsData;
  locale: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ReviewBucket }>;
  gameLabel?: string;
  gamesLabel?: string;
}

function CustomTooltip({ active, payload, gameLabel, gamesLabel }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const suffix = data.count > 1 ? gamesLabel : gameLabel;
  return (
    <div className="glass-card rounded-lg border border-white/20 px-3 py-2 shadow-lg dark:border-slate-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.range}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        {data.count} {suffix}
      </p>
    </div>
  );
}

export function ReviewAnalytics({ analytics, locale }: ReviewAnalyticsProps) {
  const t = useTranslations("playerStats");

  if (analytics.totalReviews === 0) {
    return (
      <div>
        <StatsSectionTitle>{t("reviewAnalytics.title")}</StatsSectionTitle>
        <StatsEmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          message={t("reviewAnalytics.empty")}
        />
      </div>
    );
  }

  return (
    <div>
      <StatsSectionTitle>{t("reviewAnalytics.title")}</StatsSectionTitle>
      <div className="glass-card rounded-xl p-6 transition-all duration-300">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          {/* Radial gauges à gauche */}
          <div className="shrink-0 lg:w-auto">
            <ReviewMetricsRadial analytics={analytics} locale={locale} />
          </div>
          {/* Graphique à droite */}
          <div className="h-52 min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.distribution}>
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-slate-400"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-slate-400"
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      gameLabel={t("reviewAnalytics.game")}
                      gamesLabel={t("reviewAnalytics.games")}
                    />
                  }
                  cursor={false}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
