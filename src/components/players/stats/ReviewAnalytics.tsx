"use client";

import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ReviewAnalyticsData, ReviewBucket } from "@/types/dashboard-stats";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";

interface ReviewAnalyticsProps {
  analytics: ReviewAnalyticsData;
  locale: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ReviewBucket }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-card rounded-lg border border-white/20 px-3 py-2 shadow-lg dark:border-slate-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.range}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">{data.count}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card flex flex-col items-center gap-1 rounded-xl p-4 transition-all duration-300">
      <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

export function ReviewAnalytics({ analytics, locale }: ReviewAnalyticsProps) {
  const t = useTranslations("playerStats");

  if (analytics.totalReviews === 0) {
    return (
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t("reviewAnalytics.title")}
        </h3>
        <StatsEmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          message={t("reviewAnalytics.empty")}
        />
      </div>
    );
  }

  const fmt = (v: number | null) =>
    v !== null ? formatLocalizedNumber(Math.round(v * 10) / 10, locale) : "—";

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t("reviewAnalytics.title")}
      </h3>
      <div className="glass-card rounded-xl p-6 transition-all duration-300">
        {/* Bar chart */}
        <div className="mb-6 h-52">
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
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label={t("reviewAnalytics.average")} value={fmt(analytics.averageRating)} />
          <MetricCard label={t("reviewAnalytics.median")} value={fmt(analytics.medianRating)} />
          <MetricCard label={t("reviewAnalytics.mode")} value={fmt(analytics.modeRating)} />
          <MetricCard
            label={t("reviewAnalytics.totalReviews")}
            value={formatLocalizedNumber(analytics.totalReviews, locale)}
          />
          <MetricCard
            label={t("reviewAnalytics.helpfulVotes")}
            value={formatLocalizedNumber(analytics.helpfulVotesReceived, locale)}
          />
        </div>
      </div>
    </div>
  );
}
