"use client";

import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { MonthlyActivity } from "@/types/dashboard-stats";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";

interface ActivityTimelineProps {
  timeline: MonthlyActivity[];
  locale: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MonthlyActivity }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const t = useTranslations("playerStats");

  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="glass-card rounded-lg border border-white/20 px-3 py-2 shadow-lg dark:border-slate-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.label}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        {data.gamesAdded} {t("activityTimeline.gamesAdded")}
      </p>
    </div>
  );
}

function hasActivity(timeline: MonthlyActivity[]): boolean {
  return timeline.length > 0 && timeline.some((m) => m.gamesAdded > 0);
}

export function ActivityTimeline({ timeline }: ActivityTimelineProps) {
  const t = useTranslations("playerStats");

  if (!hasActivity(timeline)) {
    return (
      <div>
        <StatsSectionTitle>{t("activityTimeline.title")}</StatsSectionTitle>
        <StatsEmptyState
          icon={<Calendar className="h-8 w-8" />}
          message={t("activityTimeline.empty")}
        />
      </div>
    );
  }

  return (
    <div>
      <StatsSectionTitle>{t("activityTimeline.title")}</StatsSectionTitle>
      <div className="glass-card rounded-xl p-6 transition-all duration-300">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-gray-600 dark:text-slate-400"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-slate-400"
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="gamesAdded" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
