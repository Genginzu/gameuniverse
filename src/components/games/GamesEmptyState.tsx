"use client";

import { useTranslations } from "next-intl";

interface GamesEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function GamesEmptyState({ hasFilters, onClearFilters }: GamesEmptyStateProps) {
  const t = useTranslations("games");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 py-16 text-center shadow-xs backdrop-blur-xl dark:bg-slate-800/50 sm:py-20">
      <div className="mb-6 rounded-full bg-linear-to-br from-gray-100 to-gray-200 p-6 dark:from-gray-700 dark:to-gray-600">
        <svg
          className="h-12 w-12 text-gray-400 sm:h-16 sm:w-16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
        {t("noGamesFound")}
      </h3>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 sm:text-base">
        {hasFilters ? t("modifySearch") : t("noGamesAvailable")}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="mt-4 rounded-lg bg-linear-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg"
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
