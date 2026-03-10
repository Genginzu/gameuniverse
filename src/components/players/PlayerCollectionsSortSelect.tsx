"use client";

import { useTranslations } from "next-intl";
import type { CollectionSortOption } from "@/types/playerCollection";

interface PlayerCollectionsSortSelectProps {
  value: CollectionSortOption;
  onChange: (option: CollectionSortOption) => void;
}

const SORT_OPTIONS: CollectionSortOption[] = [
  "updated_at_desc",
  "name_asc",
  "name_desc",
  "games_count_desc",
];

const SORT_KEYS: Record<CollectionSortOption, string> = {
  updated_at_desc: "sort.updated_at_desc",
  name_asc: "sort.name_asc",
  name_desc: "sort.name_desc",
  games_count_desc: "sort.games_count_desc",
};

export function PlayerCollectionsSortSelect({ value, onChange }: PlayerCollectionsSortSelectProps) {
  const t = useTranslations("players.collectionsTab");

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CollectionSortOption)}
      aria-label={t("sort.label")}
      className="glass-dropdown cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-violet/30 dark:text-slate-200 dark:focus:ring-neon-violet/40"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {t(SORT_KEYS[option])}
        </option>
      ))}
    </select>
  );
}
