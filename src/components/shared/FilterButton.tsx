"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface FilterButtonProps {
  hasFilters: boolean;
  filterCount: number;
  onClick: () => void;
}

export function FilterButton({ hasFilters, filterCount, onClick }: FilterButtonProps) {
  const t = useTranslations("filters");

  return (
    <button
      onClick={onClick}
      className="inline-flex h-12 cursor-pointer items-center rounded-xl bg-linear-to-r from-cyan-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg transition-all hover:from-cyan-600 hover:to-violet-600 hover:shadow-xl sm:h-14 sm:px-6 sm:text-base"
    >
      <Icon icon="mdi:filter-variant" className="size-4 sm:mr-2 sm:size-5" />
      <span className="hidden sm:inline">{t("filter")}</span>
      {hasFilters && (
        <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs sm:ml-2 sm:px-2 sm:text-sm">
          {filterCount}
        </span>
      )}
    </button>
  );
}
