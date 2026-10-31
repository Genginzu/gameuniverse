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
    <div className="relative">
      <Icon
        icon="lucide:search"
        className="text-editorial-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="border-editorial-line bg-editorial-3 placeholder:text-editorial-muted h-11 w-full rounded-md border pr-4 pl-10 text-base text-white transition focus:border-editorial-accent focus:outline-none"
      />
    </div>
  );
}
