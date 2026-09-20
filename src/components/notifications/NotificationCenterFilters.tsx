"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import {
  NOTIFICATION_CATEGORIES,
  categoryIcon,
  type NotificationCategory,
} from "@/lib/notificationDisplay";
import type { NotificationStatusFilter } from "@/types/notification";

interface NotificationCenterFiltersProps {
  category: NotificationCategory | "all";
  status: NotificationStatusFilter;
  onCategoryChange: (category: NotificationCategory | "all") => void;
  onStatusChange: (status: NotificationStatusFilter) => void;
}

const STATUSES: readonly NotificationStatusFilter[] = ["all", "unread", "read"];

export function NotificationCenterFilters({
  category,
  status,
  onCategoryChange,
  onStatusChange,
}: NotificationCenterFiltersProps) {
  const t = useTranslations("notificationCenter");

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-editorial-accent/50 bg-editorial-accent/15 text-white"
        : "border-editorial-line text-editorial-muted hover:text-white"
    }`;

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("filterByType")}>
        <button
          type="button"
          role="tab"
          aria-selected={category === "all"}
          onClick={() => onCategoryChange("all")}
          className={chip(category === "all")}
        >
          {t("categoryAll")}
        </button>
        {NOTIFICATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            onClick={() => onCategoryChange(cat)}
            className={chip(category === cat)}
          >
            <Icon icon={categoryIcon(cat)} className="size-4" aria-hidden />
            {t(`category.${cat}`)}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterByStatus")}>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => onStatusChange(s)}
            className={chip(status === s)}
          >
            {t(`status.${s}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
