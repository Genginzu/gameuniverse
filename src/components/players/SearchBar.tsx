"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useTranslations("players.posts");

  return (
    <div className="editorial-activity-search">
      <Icon icon="lucide:search" className="editorial-activity-search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchAriaLabel")}
        className="editorial-activity-search-input"
      />
    </div>
  );
}
