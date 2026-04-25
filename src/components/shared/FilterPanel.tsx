"use client";

import { useState, useCallback } from "react";
import type { FilterPanelProps } from "@/types/filters";
import { countActiveFilters } from "@/lib/utils/filter-utils";
import { ActiveFiltersDisplay } from "./ActiveFiltersDisplay";
import { FilterOptionsGrid } from "./FilterOptionsGrid";

// Re-export types and utils for backward compatibility
export type {
  FilterOption,
  FilterConfig,
  FilterPanelProps,
  FilterPanelLabels,
} from "@/types/filters";
export { hasActiveFilters, countActiveFilters, toggleFilterValue } from "@/lib/utils/filter-utils";

const defaultLabels = {
  activeFilters: "Active filters",
  selected: "selected",
  clearAll: "Clear all",
  clear: "Clear",
  available: "available",
};

/**
 * Generic FilterPanel component that supports multiple filter sections
 * with checkbox-based multi-select filters.
 */
export function FilterPanel({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  showPanel = false,
  className = "",
  labels: customLabels,
}: FilterPanelProps) {
  const labels = { ...defaultLabels, ...customLabels };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    filters.forEach((filter) => {
      if (filter.collapsible) {
        initial[filter.id] = filter.defaultExpanded ?? true;
      }
    });
    return initial;
  });

  const toggleSection = useCallback((filterId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [filterId]: !prev[filterId],
    }));
  }, []);

  const handleOptionToggle = useCallback(
    (filterId: string, optionId: string, filterType: "checkbox" | "radio") => {
      const currentValues = activeFilters[filterId] || [];

      if (filterType === "radio") {
        onFilterChange(filterId, [optionId]);
      } else {
        const newValues = currentValues.includes(optionId)
          ? currentValues.filter((v) => v !== optionId)
          : [...currentValues, optionId];
        onFilterChange(filterId, newValues);
      }
    },
    [activeFilters, onFilterChange]
  );

  const handleRemoveFilter = useCallback(
    (filterId: string, optionId: string) => {
      const currentValues = activeFilters[filterId] || [];
      const newValues = currentValues.filter((v) => v !== optionId);
      onFilterChange(filterId, newValues);
    },
    [activeFilters, onFilterChange]
  );

  const totalActiveCount = countActiveFilters(activeFilters);
  const hasFilters = totalActiveCount > 0;

  if (!hasFilters && !showPanel) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {hasFilters && (
        <ActiveFiltersDisplay
          filters={filters}
          activeFilters={activeFilters}
          totalActiveCount={totalActiveCount}
          labels={labels}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={onClearAll}
        />
      )}

      {showPanel && (
        <div className="space-y-6 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200 sm:p-6 dark:bg-gray-800 dark:ring-gray-700">
          {filters.map((filter) => {
            const isExpanded = filter.collapsible
              ? (expandedSections[filter.id] ?? filter.defaultExpanded ?? true)
              : true;

            return (
              <FilterOptionsGrid
                key={filter.id}
                filter={filter}
                activeValues={activeFilters[filter.id] || []}
                isExpanded={isExpanded}
                availableLabel={labels.available}
                onToggleSection={toggleSection}
                onOptionToggle={handleOptionToggle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
