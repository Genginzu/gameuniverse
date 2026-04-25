"use client";

import { useTranslations } from "next-intl";
import type { CollectionSortOption } from "@/types/playerCollection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Select value={value} onValueChange={(v) => onChange(v as CollectionSortOption)}>
      <SelectTrigger
        aria-label={t("sort.label")}
        className="glass-dropdown w-auto cursor-pointer gap-2 rounded-xl border-0 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 focus:ring-2 focus:ring-neon-primary/30 focus:ring-offset-0 dark:text-slate-200 dark:focus:ring-neon-primary/40"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="glass-dropdown z-50 min-w-40 overflow-hidden rounded-xl border-0 p-1">
        {SORT_OPTIONS.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className="cursor-pointer rounded-lg py-2 pl-3 pr-3 text-sm font-medium text-gray-700 transition-colors hover:bg-white/60 focus:bg-white/60 data-[state=checked]:bg-neon-primary/10 data-[state=checked]:text-neon-primary dark:text-slate-200 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60 dark:data-[state=checked]:bg-neon-primary/20 dark:data-[state=checked]:text-palette-primary-300 [&>span:first-child]:hidden"
          >
            {t(SORT_KEYS[option])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
