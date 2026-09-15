"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { GenreDistributionEntry } from "@/types/dashboard-stats";

interface CollectionGenreChartProps {
  distribution: GenreDistributionEntry[];
}

const COLORS = ["#8b5cf6", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899", "#6b7280"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: GenreDistributionEntry }>;
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

/** Pie chart of genre distribution for a collection (or aggregate). */
export function CollectionGenreChart({ distribution }: CollectionGenreChartProps) {
  const t = useTranslations("collections.stats");

  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-300">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        {t("genreDistribution")}
      </h3>
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="h-56 w-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="count"
                nameKey="genre"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
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
        <ul className="flex flex-wrap justify-center gap-3 md:flex-col">
          {distribution.map((entry, index) => (
            <li key={entry.genre} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700 dark:text-white">
                {entry.genre} ({entry.percentage}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
