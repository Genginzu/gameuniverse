"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useTranslations("players.posts");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-md backdrop-blur-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400 dark:text-violet-300" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAriaLabel")}
          className="w-full rounded-xl border border-gray-200/80 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-inner transition-all duration-200 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-slate-600/50 dark:bg-slate-700/40 dark:text-white dark:placeholder-slate-500 dark:focus:border-violet-400/40 dark:focus:ring-violet-400/15"
        />
      </div>
    </div>
  );
}
