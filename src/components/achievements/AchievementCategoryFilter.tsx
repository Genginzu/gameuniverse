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
            aria-pressed={isActive}
            onClick={() => onCategoryChange(value)}
            className={`min-h-[44px] rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 sm:min-h-0 ${
              isActive
                ? "border-editorial-accent/60 bg-editorial-accent/15 text-editorial-accent"
                : "border-editorial-line bg-editorial-3 hover:border-editorial-accent/55 text-zinc-300 hover:text-white"
            }`}
          >
            {t(`categories.${key}`)}
          </button>
        );
      })}
    </div>
  );
}
