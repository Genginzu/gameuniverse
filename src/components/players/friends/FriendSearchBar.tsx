"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface FriendSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function FriendSearchBar({ value, onChange }: FriendSearchBarProps) {
  const t = useTranslations("friends");

  return (
    <div className="editorial-friends-search">
      <Icon icon="lucide:search" className="editorial-friends-search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="editorial-friends-search-input"
      />
    </div>
  );
}
