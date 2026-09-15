"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { PlatformDistributionEntry } from "@/types/dashboard-stats";

interface CollectionPlatformChartProps {
  distribution: PlatformDistributionEntry[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PlatformDistributionEntry }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-card rounded-lg border border-white/20 px-3 py-2 shadow-lg dark:border-slate-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.platform}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        {data.count} — {data.percentage}%
      </p>
    </div>
  );
}

/** Bar chart of platform distribution for a collection (or aggregate). */
export function CollectionPlatformChart({ distribution }: CollectionPlatformChartProps) {
  const t = useTranslations("collections.stats");

  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-300">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        {t("platformDistribution")}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <XAxis
              dataKey="platform"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
