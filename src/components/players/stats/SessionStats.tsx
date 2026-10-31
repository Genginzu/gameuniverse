"use client";

import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { SessionDailyChart } from "@/components/players/stats/SessionDailyChart";
import type { SessionStatsData } from "@/types/dashboard-stats";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";

interface SessionStatsProps {
  sessions: SessionStatsData;
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
      icon: <Icon icon="lucide:activity" className="text-neon-primary h-5 w-5" />,
      label: t("sessions.totalSessions"),
      value: formatLocalizedNumber(sessions.totalSessions, locale),
    },
    {
      icon: <Icon icon="lucide:clock" className="text-neon-primary h-5 w-5" />,
      label: t("sessions.averageDuration"),
      value:
        sessions.averageDurationMinutes !== null
          ? `${formatLocalizedNumber(sessions.averageDurationMinutes, locale)} ${t("sessions.minutes")}`
          : "—",
    },
    {
      icon: <Icon icon="lucide:timer" className="text-neon-primary h-5 w-5" />,
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
            className="glass-card flex flex-col items-center gap-1 rounded-lg p-4 text-center transition-all duration-300"
          >
            {metric.icon}
            <span className="text-lg font-bold text-gray-900 dark:text-white">{metric.value}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">{metric.label}</span>
          </div>
        ))}
      </div>

      <SessionDailyChart days={sessions.dailyLast30Days ?? []} />
    </div>
  );
}
