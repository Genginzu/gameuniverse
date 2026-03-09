"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface FriendSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function FriendSearchBar({ value, onChange }: FriendSearchBarProps) {
  const t = useTranslations("friends");

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500"
      />
    </div>
  );
}
