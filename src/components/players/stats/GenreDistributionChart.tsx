"use client";

import { useTranslations } from "next-intl";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { GenreDistributionEntry } from "@/types/dashboard-stats";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";

interface GenreDistributionChartProps {
  distribution: GenreDistributionEntry[];
  locale: string;
}

const COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#6b7280", // gray (for "Autres")
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: GenreDistributionEntry;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="glass-card rounded-lg border border-white/20 px-3 py-2 shadow-lg dark:border-slate-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.genre}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        {data.count} — {data.percentage}%
      </p>
    </div>
  );
}

export function GenreDistributionChart({
  distribution,
  locale: _locale,
}: GenreDistributionChartProps) {
  const t = useTranslations("playerStats");

  if (distribution.length === 0) {
    return (
      <div>
        <StatsSectionTitle>{t("genreDistribution.title")}</StatsSectionTitle>
        <StatsEmptyState
          icon={<PieChartIcon className="h-8 w-8" />}
          message={t("genreDistribution.empty")}
        />
      </div>
    );
  }

  return (
    <div>
      <StatsSectionTitle>{t("genreDistribution.title")}</StatsSectionTitle>
      <div className="glass-card rounded-xl p-6 transition-all duration-300">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="h-64 w-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="genre"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={entry.genre} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:flex-col">
            {distribution.map((entry, index) => (
              <div key={entry.genre} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {entry.genre} ({entry.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
