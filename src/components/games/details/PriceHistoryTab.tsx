"use client";

import { useState, useMemo } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { formatChartData } from "@/lib/services/priceHistoryService";
import { PriceHistoryFiltersBar } from "@/components/games/details/PriceHistoryFilters";
import { PriceHistoryStatsDisplay } from "@/components/games/details/PriceHistoryStats";
import { PriceHistoryChart } from "@/components/games/details/PriceHistoryChart";
import type { PriceHistoryFilters } from "@/types/price-history";

interface PriceHistoryTabProps {
  gameSlug: string;
  currentPrice?: number;
  colors?: { primary: string; secondary: string };
}

export function PriceHistoryTab({ gameSlug, currentPrice }: PriceHistoryTabProps) {
  const [filters, setFilters] = useState<PriceHistoryFilters>({ period: "1y" });
  const { history, stats, isLoading, error, refetch } = usePriceHistory(gameSlug, filters);

  const chartData = useMemo(() => formatChartData(history), [history]);

  const storeNames = useMemo(() => {
    const names = new Set<string>();
    for (const snapshot of history) {
      names.add(snapshot.store_name);
    }
    return [...names];
  }, [history]);

  // Loading state — skeleton placeholders
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-14 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-7 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[350px] w-full rounded-md" />
      </div>
    );
  }

  // Error state — message with retry button
  if (error) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-muted-foreground">
            Impossible de charger l&apos;historique de prix.
          </p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state — no history available
  if (history.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucun historique de prix disponible pour ce jeu.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = stats?.currency ?? "EUR";

  return (
    <div className="flex flex-col gap-6">
      <PriceHistoryFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        availableStores={storeNames}
      />
      {stats && <PriceHistoryStatsDisplay stats={stats} currentPrice={currentPrice} />}
      <PriceHistoryChart chartData={chartData} storeNames={storeNames} currency={currency} />
    </div>
  );
}
