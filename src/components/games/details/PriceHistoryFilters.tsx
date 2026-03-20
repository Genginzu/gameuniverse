"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriceHistoryFilters, PriceHistoryPeriod } from "@/types/price-history";

interface PriceHistoryFiltersProps {
  filters: PriceHistoryFilters;
  onFiltersChange: (filters: PriceHistoryFilters) => void;
  availableStores: string[];
}

const PERIOD_OPTIONS: { value: PriceHistoryPeriod; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1A" },
  { value: "all", label: "Tout" },
];

export function PriceHistoryFiltersBar({
  filters,
  onFiltersChange,
  availableStores,
}: PriceHistoryFiltersProps) {
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
      <div className="flex items-center gap-1" role="group" aria-label="Sélection de période">
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filters.period === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange(option.value)}
            aria-pressed={filters.period === option.value}
            className={cn("min-w-12", filters.period === option.value && "pointer-events-none")}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Store filter */}
      {availableStores.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label="Filtre par magasin"
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
