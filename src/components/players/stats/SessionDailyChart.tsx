"use client";

import { useTranslations, useLocale } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { DailySessionStats } from "@/types/dashboard-stats";
import { splitMinutes } from "@/lib/utils/statsFormatters";
import { chartColor } from "@/lib/utils/chart-colors";

interface SessionDailyChartProps {
  days: DailySessionStats[];
}

interface DailyTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailySessionStats }>;
}

function formatDay(isoDate: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`)
  );
}

function DailyTooltip({ active, payload }: DailyTooltipProps) {
  const t = useTranslations("playerStats");
  const locale = useLocale();

  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const { hours, minutes } = splitMinutes(data.totalMinutes);
  const duration =
    hours === 0
      ? t("sessions.durationMinutes", { minutes })
      : minutes === 0
        ? t("sessions.durationHours", { hours })
        : t("sessions.durationHoursMinutes", { hours, minutes });

  return (
    <div className="border-editorial-line bg-editorial-2 rounded-lg border px-3 py-2 shadow-lg shadow-black/30">
      <p className="text-sm font-semibold text-white capitalize">
        {formatDay(data.date, locale, { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <p className="text-editorial-muted text-xs">
        {t("sessions.tooltipSessions", { count: data.sessionCount })}
      </p>
      <p className="text-editorial-muted text-xs">{t("sessions.tooltipTotalTime", { duration })}</p>
    </div>
  );
}

export function SessionDailyChart({ days }: SessionDailyChartProps) {
  const t = useTranslations("playerStats");
  const locale = useLocale();

  return (
    <div className="border-editorial-line bg-editorial-3 rounded-lg border p-4 md:p-6">
      <p className="text-editorial-muted mb-3 text-sm">{t("sessions.last30Days")}</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days}>
            <XAxis
              dataKey="date"
              tickFormatter={(date: string) => formatDay(date, locale, { day: "numeric", month: "short" })}
              tick={{ fontSize: 11 }}
              minTickGap={16}
              className="text-gray-600 dark:text-slate-400"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              width={28}
              className="text-gray-600 dark:text-slate-400"
            />
            <Tooltip content={<DailyTooltip />} cursor={{ fill: "rgb(255 255 255 / 0.04)" }} />
            <Bar dataKey="sessionCount" fill={chartColor(0)} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
