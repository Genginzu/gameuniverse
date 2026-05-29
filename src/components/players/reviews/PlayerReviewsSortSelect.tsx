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
      className="editorial-reviews-sort"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {t(SORT_KEYS[option])}
        </option>
      ))}
    </select>
  );
}
