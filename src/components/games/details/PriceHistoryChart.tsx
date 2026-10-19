"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { PriceChartDataPoint } from "@/types/price-history";
import { formatPriceChartDate, formatPriceWithCurrency } from "@/lib/utils/priceChartFormat";
import { CHART_NEUTRAL, chartColor } from "@/lib/utils/chart-colors";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string | number;
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  currency: string;
}

interface PriceHistoryChartProps {
  chartData: PriceChartDataPoint[];
  storeNames: string[];
  currency: string;
}

/** Tooltip personnalisé affichant prix, magasin et date */
function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--editorial-line)] bg-[var(--editorial-bg-2)] p-3 shadow-lg shadow-black/30">
      <p className="mb-1.5 text-sm font-medium text-white">
        {formatPriceChartDate(label as string)}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-semibold text-white">
            {formatPriceWithCurrency(entry.value as number, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PriceHistoryChart({ chartData, storeNames, currency }: PriceHistoryChartProps) {
  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <XAxis
          dataKey="date"
          tickFormatter={formatPriceChartDate}
          tick={{ fontSize: 12 }}
          stroke={CHART_NEUTRAL}
        />
        <YAxis
          tickFormatter={(v: number) => formatPriceWithCurrency(v, currency)}
          tick={{ fontSize: 12 }}
          stroke={CHART_NEUTRAL}
          width={90}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend />
        {storeNames.map((store, index) => (
          <Line
            key={store}
            type="monotone"
            dataKey={store}
            name={store}
            stroke={chartColor(index)}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
