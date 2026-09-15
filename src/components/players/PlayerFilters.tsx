"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { type GameCountRangeKey } from "@/types/player";
import type { FilterConfig } from "@/types/filters";
import { FilterPanel } from "@/components/shared/FilterPanel";

interface PlayerFiltersProps {
  selectedGameCounts: string[];
  onGameCountChange: (counts: string[]) => void;
  onClearFilters: () => void;
  showAllFilters: boolean;
  locale?: string;
}

const GAME_COUNT_OPTIONS: { value: GameCountRangeKey }[] = [
  { value: "0" },
  { value: "1-5" },
  { value: "6-20" },
  { value: "20+" },
];

const FILTER_ID = "gameCount";

export function PlayerFilters({
  selectedGameCounts,
  onGameCountChange,
  onClearFilters,
  showAllFilters,
}: PlayerFiltersProps) {
  const t = useTranslations("players.filters");
  const tRanges = useTranslations("players.gameCountRanges");

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        id: FILTER_ID,
        label: t("byGameCount"),
        type: "checkbox",
        options: GAME_COUNT_OPTIONS.map((option) => ({
          id: option.value,
          label: tRanges(option.value),
        })),
      },
    ],
    [t, tRanges]
  );

  return (
    <FilterPanel
      filters={filters}
      activeFilters={{ [FILTER_ID]: selectedGameCounts }}
      onFilterChange={(_filterId, values) => onGameCountChange(values)}
      onClearAll={onClearFilters}
      showPanel={showAllFilters}
      labels={{
        activeFilters: t("active"),
        selected: t("selected"),
        clearAll: t("clearAll"),
        clear: t("clear"),
        available: t("options"),
      }}
    />
  );
}

export { GAME_COUNT_OPTIONS };
