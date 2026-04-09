"use client";

import { type GameCountRangeKey } from "@/types/player";
import { useTranslations } from "next-intl";

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

export function PlayerFilters({
  selectedGameCounts,
  onGameCountChange,
  onClearFilters,
  showAllFilters,
}: PlayerFiltersProps) {
  const t = useTranslations("players.filters");
  const tRanges = useTranslations("players.gameCountRanges");

  const handleGameCountToggle = (value: string) => {
    const newSelectedCounts = selectedGameCounts.includes(value)
      ? selectedGameCounts.filter((c) => c !== value)
      : [...selectedGameCounts, value];

    onGameCountChange(newSelectedCounts);
  };

  const hasFilters = selectedGameCounts.length > 0;

  // Don't render anything if no filters are active and panel is closed
  if (!hasFilters && !showAllFilters) {
    return null;
  }

  const getLabel = (option: (typeof GAME_COUNT_OPTIONS)[0]) => {
    return tRanges(option.value);
  };

  return (
    <div className="space-y-4">
      {/* Clear all button - positioned at the right */}
      {hasFilters && (
        <div className="flex justify-end">
          <button
            onClick={onClearFilters}
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
            <span className="hidden sm:inline">{t("clearAll")}</span>
            <span className="sm:hidden">{t("clear")}</span>
          </button>
        </div>
      )}

      {/* Active filters display */}
      {hasFilters && (
        <div className="rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {t("active")}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {t("selected", { count: selectedGameCounts.length })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGameCounts.map((countValue) => {
              const option = GAME_COUNT_OPTIONS.find((o) => o.value === countValue);
              return (
                <div
                  key={countValue}
                  className="inline-flex items-center rounded-lg bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-xs ring-1 ring-gray-200 sm:px-3 sm:py-1.5 sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"
                >
                  <span className="mr-1 sm:mr-2">{option ? getLabel(option) : countValue}</span>
                  <button
                    onClick={() => handleGameCountToggle(countValue)}
                    className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded filters */}
      {showAllFilters && (
        <div className="space-y-6 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200 sm:p-6 dark:bg-gray-800 dark:ring-gray-700">
          {/* Game count filters section */}
          <div>
            <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                {t("byGameCount")}
              </h3>
              <span className="mt-1 text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
                {GAME_COUNT_OPTIONS.length} {t("options")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
              {GAME_COUNT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="group relative flex cursor-pointer items-center rounded-lg border border-gray-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                >
                  <input
                    type="checkbox"
                    checked={selectedGameCounts.includes(option.value)}
                    onChange={() => handleGameCountToggle(option.value)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all sm:h-5 sm:w-5 ${
                      selectedGameCounts.includes(option.value)
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 group-hover:border-blue-400 dark:border-gray-600"
                    }`}
                  >
                    {selectedGameCounts.includes(option.value) && (
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
                      {getLabel(option)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { GAME_COUNT_OPTIONS };
