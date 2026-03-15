"use client";

import { useTranslations } from "next-intl";
import type { AchievementCategory } from "@/types/achievement";

interface AchievementCategoryFilterProps {
  selectedCategory: AchievementCategory | null;
  onCategoryChange: (category: AchievementCategory | null) => void;
}

const CATEGORIES: Array<{ value: AchievementCategory | null; key: string }> = [
  { value: null, key: "all" },
  { value: "library", key: "library" },
  { value: "playtime", key: "playtime" },
  { value: "reviews", key: "reviews" },
  { value: "social", key: "social" },
  { value: "collections", key: "collections" },
];

export function AchievementCategoryFilter({
  selectedCategory,
  onCategoryChange,
}: AchievementCategoryFilterProps) {
  const t = useTranslations("achievements");

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(({ value, key }) => {
        const isActive = selectedCategory === value;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onCategoryChange(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
              isActive
                ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:border-purple-400 dark:bg-purple-500/15 dark:text-purple-300"
                : "bg-white/40 text-gray-700 hover:bg-white/60 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/60"
            } border ${
              isActive
                ? "border-purple-500 dark:border-purple-400"
                : "border-white/20 dark:border-slate-700/50"
            }`}
          >
            {t(`categories.${key}`)}
          </button>
        );
      })}
    </div>
  );
}
