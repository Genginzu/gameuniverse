"use client";

import { useTranslations } from "next-intl";
import { Star, MessageCircle, Library, Clock, Heart, FolderOpen, LayoutGrid } from "lucide-react";
import type { ActivityFilter } from "@/hooks/usePlayerActivity";

const FILTER_OPTIONS: { value: ActivityFilter; icon: React.ElementType }[] = [
  { value: "all", icon: LayoutGrid },
  { value: "review", icon: Star },
  { value: "comment", icon: MessageCircle },
  { value: "library", icon: Library },
  { value: "playtime", icon: Clock },
  { value: "favorite", icon: Heart },
  { value: "collection", icon: FolderOpen },
];

interface ActivityFiltersProps {
  activeFilter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
}

export function ActivityFilters({ activeFilter, onFilterChange }: ActivityFiltersProps) {
  const t = useTranslations("players.activity.filters");

  return (
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("label")}>
      {FILTER_OPTIONS.map(({ value, icon: Icon }) => {
        const isActive = activeFilter === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-300 dark:ring-cyan-500/40"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            }`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
            {t(value)}
          </button>
        );
      })}
    </div>
  );
}
