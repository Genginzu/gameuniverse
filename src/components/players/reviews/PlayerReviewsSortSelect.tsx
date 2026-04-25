"use client";

import { useTranslations } from "next-intl";
import type { ReviewSortOption } from "@/types/playerReview";

interface PlayerReviewsSortSelectProps {
  value: ReviewSortOption;
  onChange: (option: ReviewSortOption) => void;
}

const SORT_OPTIONS: ReviewSortOption[] = ["date_desc", "date_asc", "rating_desc", "rating_asc"];

const SORT_KEYS: Record<ReviewSortOption, string> = {
  date_desc: "sort.dateDesc",
  date_asc: "sort.dateAsc",
  rating_desc: "sort.ratingDesc",
  rating_asc: "sort.ratingAsc",
};

export function PlayerReviewsSortSelect({ value, onChange }: PlayerReviewsSortSelectProps) {
  const t = useTranslations("players.reviews");

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ReviewSortOption)}
      aria-label={t("sort.label")}
      className="cursor-pointer rounded-xl border border-white/20 bg-white/40 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-xl transition-all duration-300 hover:bg-white/60 focus:outline-hidden focus:ring-2 focus:ring-neon-primary/30 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700/60 dark:focus:ring-neon-primary/40"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {t(SORT_KEYS[option])}
        </option>
      ))}
    </select>
  );
}
