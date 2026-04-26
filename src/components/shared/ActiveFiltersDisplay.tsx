"use client";

import { Icon } from "@iconify/react";
import type { FilterConfig, FilterPanelLabels } from "@/types/filters";

interface ActiveFiltersDisplayProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string[]>;
  totalActiveCount: number;
  labels: Required<FilterPanelLabels>;
  onRemoveFilter: (filterId: string, optionId: string) => void;
  onClearAll: () => void;
}

function getOptionLabel(filters: FilterConfig[], filterId: string, optionId: string): string {
  const filter = filters.find((f) => f.id === filterId);
  const option = filter?.options.find((o) => o.id === optionId);
  return option?.label || optionId;
}

export function ActiveFiltersDisplay({
  filters,
  activeFilters,
  totalActiveCount,
  labels,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersDisplayProps) {
  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={onClearAll}
          className="inline-flex items-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 sm:px-4 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <Icon icon="lucide:x" className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">{labels.clearAll}</span>
          <span className="sm:hidden">{labels.clear}</span>
        </button>
      </div>

      <div className="rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
            {labels.activeFilters}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {totalActiveCount} {labels.selected}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([filterId, values]) =>
            values.map((optionId) => (
              <div
                key={`${filterId}-${optionId}`}
                className="inline-flex items-center rounded-lg bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-xs ring-1 ring-gray-200 sm:px-3 sm:py-1.5 sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"
              >
                <span className="mr-1 sm:mr-2">{getOptionLabel(filters, filterId, optionId)}</span>
                <button
                  onClick={() => onRemoveFilter(filterId, optionId)}
                  className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                >
                  <Icon icon="lucide:x" className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
