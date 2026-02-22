"use client";

import { TrendingDown, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computePriceIndicators } from "@/lib/services/priceHistoryService";
import type { PriceHistoryStats } from "@/types/price-history";

interface PriceHistoryStatsProps {
  stats: PriceHistoryStats;
  currentPrice?: number;
}

function formatPrice(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

export function PriceHistoryStatsDisplay({ stats, currentPrice }: PriceHistoryStatsProps) {
  const indicators =
    currentPrice !== undefined ? computePriceIndicators(currentPrice, stats) : null;

  const cards = [
    {
      label: "Prix minimum",
      value: stats.min_price,
      icon: TrendingDown,
      iconColor: "text-green-500",
    },
    {
      label: "Prix maximum",
      value: stats.max_price,
      icon: TrendingUp,
      iconColor: "text-red-500",
    },
    {
      label: "Prix moyen",
      value: stats.avg_price,
      icon: BarChart3,
      iconColor: "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-md bg-white/10 p-2 ${card.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="text-lg font-semibold text-white">
                  {formatPrice(card.value, stats.currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {indicators && (indicators.isLowestPrice || indicators.isBelowAverage) && (
        <div className="flex flex-wrap gap-2 sm:col-span-3">
          {indicators.isLowestPrice && (
            <Badge className="border border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/10">
              🏷️ Prix au plus bas
            </Badge>
          )}
          {indicators.isBelowAverage && (
            <Badge className="border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/10">
              📉 En dessous de la moyenne
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
