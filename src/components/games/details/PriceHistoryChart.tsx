"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { PriceChartDataPoint } from "@/types/price-history";

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

/** Palette de couleurs distinctes pour les courbes de magasins */
const STORE_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
  "#ff6b6b",
  "#a855f7",
  "#f472b6",
  "#34d399",
];

interface PriceHistoryChartProps {
  chartData: PriceChartDataPoint[];
  storeNames: string[];
  currency: string;
}

/** Formate une date ISO (YYYY-MM-DD) en libellé court (ex: "Jan 2024") */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

/** Formate un prix avec sa devise */
function formatPrice(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

/** Tooltip personnalisé affichant prix, magasin et date */
function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-1.5 text-sm font-medium">{formatDateLabel(label as string)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{formatPrice(entry.value as number, currency)}</span>
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
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          tickFormatter={(v: number) => formatPrice(v, currency)}
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
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
            stroke={STORE_COLORS[index % STORE_COLORS.length]}
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
