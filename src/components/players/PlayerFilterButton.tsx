"use client";

import { useTranslations } from "next-intl";

interface PlayerFilterButtonProps {
  hasFilters: boolean;
  filterCount: number;
  onClick: () => void;
  locale?: string;
}

export function PlayerFilterButton({ hasFilters, filterCount, onClick }: PlayerFilterButtonProps) {
  const t = useTranslations("players.filters");

  return (
    <button
      onClick={onClick}
      className="inline-flex h-12 items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl sm:h-14 sm:px-6 sm:text-base"
    >
      <svg
        className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
        />
      </svg>
      <span className="hidden sm:inline">{t("filter")}</span>
      {hasFilters && (
        <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs sm:ml-2 sm:px-2 sm:text-sm">
          {filterCount}
        </span>
      )}
    </button>
  );
}
