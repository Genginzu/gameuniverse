"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriceHistoryFilters, PriceHistoryPeriod } from "@/types/price-history";

interface PriceHistoryFiltersProps {
  filters: PriceHistoryFilters;
  onFiltersChange: (filters: PriceHistoryFilters) => void;
  availableStores: string[];
}

const PERIOD_OPTIONS: PriceHistoryPeriod[] = ["1m", "3m", "6m", "1y", "all"];

export function PriceHistoryFiltersBar({
  filters,
  onFiltersChange,
  availableStores,
}: PriceHistoryFiltersProps) {
  const t = useTranslations("gameDetails.priceHistory");

  function handlePeriodChange(period: PriceHistoryPeriod) {
    onFiltersChange({ ...filters, period });
  }

  function handleStoreToggle(storeName: string) {
    const newStore = filters.store === storeName ? undefined : storeName;
    onFiltersChange({ ...filters, store: newStore });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Period selector */}
      <div className="flex items-center gap-1" role="group" aria-label={t("periodSelectionLabel")}>
        {PERIOD_OPTIONS.map((period) => (
          <Button
            key={period}
            variant={filters.period === period ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange(period)}
            aria-pressed={filters.period === period}
            className={cn("min-w-12", filters.period === period && "pointer-events-none")}
          >
            {t(`periods.${period}`)}
          </Button>
        ))}
      </div>

      {/* Store filter */}
      {availableStores.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label={t("storeFilterLabel")}
        >
          {availableStores.map((store) => (
            <Button
              key={store}
              variant={filters.store === store ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleStoreToggle(store)}
              aria-pressed={filters.store === store}
              className={cn("text-xs", filters.store === store && "ring-ring ring-1")}
            >
              {store}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
