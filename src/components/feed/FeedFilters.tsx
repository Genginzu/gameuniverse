"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { FeedFilter } from "@/hooks/useFriendsFeed";

const FILTER_OPTIONS: { value: FeedFilter; icon: string }[] = [
  { value: "all", icon: "lucide:layout-grid" },
  { value: "review", icon: "lucide:star" },
  { value: "post", icon: "lucide:message-square" },
  { value: "library", icon: "lucide:library" },
  { value: "playtime", icon: "lucide:clock" },
  { value: "favorite", icon: "lucide:heart" },
  { value: "collection", icon: "lucide:folder-open" },
  { value: "session", icon: "lucide:gamepad-2" },
  { value: "achievement", icon: "lucide:trophy" },
];

interface FeedFiltersProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

export function FeedFilters({ activeFilter, onFilterChange }: FeedFiltersProps) {
  const t = useTranslations("feedPage.filters");

  return (
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("label")}>
      {FILTER_OPTIONS.map(({ value, icon }) => {
        const isActive = activeFilter === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.15)] text-[rgb(var(--accent-rgb,var(--neon-primary)))] ring-1 ring-[rgba(var(--accent-rgb,var(--neon-primary)),0.4)]"
                : "border border-[var(--editorial-line)] bg-[var(--editorial-bg-3)] text-[var(--editorial-muted)] hover:text-white hover:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.3)]"
            }`}
            aria-pressed={isActive}
          >
            <Icon icon={icon} className="h-4 w-4" />
            {t(value)}
          </button>
        );
      })}
    </div>
  );
}
