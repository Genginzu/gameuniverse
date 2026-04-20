"use client";

import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { SessionStatsData, DayFrequency } from "@/types/dashboard-stats";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";

interface SessionStatsProps {
  sessions: SessionStatsData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DayFrequency }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const t = useTranslations("playerStats");

  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="glass-card rounded-lg border border-white/20 px-3 py-2 shadow-lg dark:border-slate-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t(`sessions.days.${data.label}`)}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        {data.sessionCount} {t("sessions.sessionsCount")}
      </p>
    </div>
  );
}

export function SessionStats({ sessions }: SessionStatsProps) {
  const t = useTranslations("playerStats");
  const locale = useLocale();

  if (sessions.totalSessions === 0) {
    return (
      <div>
        <StatsSectionTitle>{t("sessions.title")}</StatsSectionTitle>
        <StatsEmptyState
          icon={<Icon icon="lucide:activity" className="h-8 w-8" />}
          message={t("sessions.empty")}
        />
      </div>
    );
  }

  const metrics = [
    {
      icon: <Icon icon="lucide:activity" className="text-neon-violet h-5 w-5" />,
      label: t("sessions.totalSessions"),
      value: formatLocalizedNumber(sessions.totalSessions, locale),
    },
    {
      icon: <Icon icon="lucide:clock" className="text-neon-violet h-5 w-5" />,
      label: t("sessions.averageDuration"),
      value:
        sessions.averageDurationMinutes !== null
          ? `${formatLocalizedNumber(sessions.averageDurationMinutes, locale)} ${t("sessions.minutes")}`
          : "—",
    },
    {
      icon: <Icon icon="lucide:timer" className="text-neon-violet h-5 w-5" />,
      label: t("sessions.longestSession"),
      value:
        sessions.longestSessionMinutes !== null
          ? `${formatLocalizedNumber(sessions.longestSessionMinutes, locale)} ${t("sessions.minutes")}`
          : "—",
    },
  ];

  return (
    <div>
      <StatsSectionTitle>{t("sessions.title")}</StatsSectionTitle>

      {/* Metric cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="glass-card flex flex-col items-center gap-1 rounded-xl p-4 text-center transition-all duration-300"
          >
            {metric.icon}
            <span className="text-lg font-bold text-gray-900 dark:text-white">{metric.value}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Frequency bar chart */}
      <div className="glass-card rounded-xl p-6 transition-all duration-300">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessions.frequencyByDayOfWeek}>
              <XAxis
                dataKey="label"
                tickFormatter={(label) => t(`sessions.days.${label}`)}
                tick={{ fontSize: 11 }}
                className="text-gray-600 dark:text-slate-400"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-slate-400"
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="sessionCount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
