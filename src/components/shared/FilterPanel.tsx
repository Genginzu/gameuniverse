"use client";

import { useState, useCallback } from "react";

/**
 * Individual filter option
 */
export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

/**
 * Filter section configuration
 */
export interface FilterConfig {
  id: string;
  label: string;
  type: "checkbox" | "radio";
  options: FilterOption[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FilterPanelProps {
  /** Array of filter configurations */
  filters: FilterConfig[];
  /** Currently active filters (filterId -> selected option ids) */
  activeFilters: Record<string, string[]>;
  /** Callback when a filter value changes */
  onFilterChange: (filterId: string, values: string[]) => void;
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Whether to show the expanded filter panel */
  showPanel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Labels for UI elements */
  labels?: {
    activeFilters?: string;
    selected?: string;
    clearAll?: string;
    clear?: string;
    available?: string;
  };
}

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
 * 
 * @example
 * <FilterPanel
 *   filters={[
 *     {
 *       id: "genres",
 *       label: "Genres",
 *       type: "checkbox",
 *       options: [
 *         { id: "action", label: "Action", count: 42 },
 *         { id: "rpg", label: "RPG", count: 28 },
 *       ],
 *     },
 *   ]}
 *   activeFilters={{ genres: ["action"] }}
 *   onFilterChange={(filterId, values) => setFilters({ ...filters, [filterId]: values })}
 *   onClearAll={() => setFilters({})}
 * />
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
  
  // Track expanded state for collapsible sections
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
        // Radio: single selection
        onFilterChange(filterId, [optionId]);
      } else {
        // Checkbox: toggle selection
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

  // Calculate total active filter count
  const totalActiveCount = Object.values(activeFilters).reduce(
    (sum, values) => sum + values.length,
    0
  );

  const hasFilters = totalActiveCount > 0;

  // Get label for an option by looking it up in the filter config
  const getOptionLabel = (filterId: string, optionId: string): string => {
    const filter = filters.find((f) => f.id === filterId);
    const option = filter?.options.find((o) => o.id === optionId);
    return option?.label || optionId;
  };

  // Don't render anything if no filters are active and panel is closed
  if (!hasFilters && !showPanel) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Clear all button - positioned at the right */}
      {hasFilters && (
        <div className="flex justify-end">
          <button
            onClick={onClearAll}
            className="inline-flex items-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 sm:px-4 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="hidden sm:inline">{labels.clearAll}</span>
            <span className="sm:hidden">{labels.clear}</span>
          </button>
        </div>
      )}

      {/* Active filters display */}
      {hasFilters && (
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
                  <span className="mr-1 sm:mr-2">{getOptionLabel(filterId, optionId)}</span>
                  <button
                    onClick={() => handleRemoveFilter(filterId, optionId)}
                    className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Expanded filter sections */}
      {showPanel && (
        <div className="space-y-6 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200 sm:p-6 dark:bg-gray-800 dark:ring-gray-700">
          {filters.map((filter) => {
            const isExpanded = filter.collapsible
              ? expandedSections[filter.id] ?? filter.defaultExpanded ?? true
              : true;

            return (
              <div key={filter.id}>
                {/* Section header */}
                <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
                  {filter.collapsible ? (
                    <button
                      onClick={() => toggleSection(filter.id)}
                      className="flex items-center text-base font-semibold text-gray-900 sm:text-lg dark:text-white"
                    >
                      {filter.label}
                      <svg
                        className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  ) : (
                    <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                      {filter.label}
                    </h3>
                  )}
                  <span className="mt-1 text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
                    {filter.options.length} {labels.available}
                  </span>
                </div>

                {/* Filter options grid */}
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filter.options.map((option) => {
                      const isSelected = (activeFilters[filter.id] || []).includes(option.id);

                      return (
                        <label
                          key={option.id}
                          className="group relative flex cursor-pointer items-center rounded-lg border border-gray-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                        >
                          <input
                            type={filter.type}
                            name={filter.type === "radio" ? filter.id : undefined}
                            checked={isSelected}
                            onChange={() => handleOptionToggle(filter.id, option.id, filter.type)}
                            className="sr-only"
                          />
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded${filter.type === "radio" ? "-full" : ""} border-2 transition-all sm:h-5 sm:w-5 ${
                              isSelected
                                ? "border-blue-600 bg-blue-600"
                                : "border-gray-300 group-hover:border-blue-400 dark:border-gray-600"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="ml-2 min-w-0 flex-1 sm:ml-3">
                            <span className="text-xs font-medium text-gray-900 sm:text-sm dark:text-white">
                              {option.label}
                            </span>
                            {option.count !== undefined && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {option.count}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to check if any filters are active.
 * Exported for testing purposes.
 */
export function hasActiveFilters(activeFilters: Record<string, string[]>): boolean {
  return Object.values(activeFilters).some((values) => values.length > 0);
}

/**
 * Helper function to count total active filters.
 * Exported for testing purposes.
 */
export function countActiveFilters(activeFilters: Record<string, string[]>): number {
  return Object.values(activeFilters).reduce((sum, values) => sum + values.length, 0);
}

/**
 * Helper function to toggle a filter value.
 * Exported for testing purposes.
 */
export function toggleFilterValue(
  currentValues: string[],
  value: string,
  type: "checkbox" | "radio"
): string[] {
  if (type === "radio") {
    return [value];
  }
  
  if (currentValues.includes(value)) {
    return currentValues.filter((v) => v !== value);
  }
  
  return [...currentValues, value];
}
