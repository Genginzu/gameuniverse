"use client";

import { Icon } from "@iconify/react";
import type { FilterConfig } from "@/types/filters";

interface FilterOptionsGridProps {
  filter: FilterConfig;
  activeValues: string[];
  isExpanded: boolean;
  availableLabel: string;
  onToggleSection: (filterId: string) => void;
  onOptionToggle: (filterId: string, optionId: string, type: "checkbox" | "radio") => void;
}

export function FilterOptionsGrid({
  filter,
  activeValues,
  isExpanded,
  availableLabel,
  onToggleSection,
  onOptionToggle,
}: FilterOptionsGridProps) {
  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        {filter.collapsible ? (
          <button
            onClick={() => onToggleSection(filter.id)}
            className="flex items-center text-base font-semibold text-gray-900 sm:text-lg dark:text-white"
          >
            {filter.label}
            <Icon
              icon="lucide:chevron-down"
              className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
            {filter.label}
          </h3>
        )}
        <span className="mt-1 text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
          {filter.options.length} {availableLabel}
        </span>
      </div>

      {/* Filter options grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filter.options.map((option) => {
            const isSelected = activeValues.includes(option.id);

            return (
              <label
                key={option.id}
                className="group relative flex cursor-pointer items-center rounded-lg border border-gray-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
              >
                <input
                  type={filter.type}
                  name={filter.type === "radio" ? filter.id : undefined}
                  checked={isSelected}
                  onChange={() => onOptionToggle(filter.id, option.id, filter.type)}
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
                    <Icon icon="lucide:check" className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
                  )}
                </div>
                <div className="ml-2 min-w-0 flex-1 sm:ml-3">
                  <span className="text-xs font-medium text-gray-900 sm:text-sm dark:text-white">
                    {option.label}
                  </span>
                  {option.count !== undefined && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{option.count}</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
