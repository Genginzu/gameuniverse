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
    <div className="rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-md backdrop-blur-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20">
      <div className="relative">
        <Icon
          icon="lucide:search"
          className="text-palette-primary-400 dark:text-palette-primary-300 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAriaLabel")}
          className="focus:border-palette-primary-400/50 focus:ring-palette-primary-400/20 dark:focus:border-palette-primary-400/40 dark:focus:ring-palette-primary-400/15 w-full rounded-xl border border-gray-200/80 bg-white/60 py-2.5 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-400 shadow-inner transition-all duration-200 focus:ring-2 focus:outline-hidden dark:border-slate-600/50 dark:bg-slate-700/40 dark:text-white dark:placeholder-slate-500"
        />
      </div>
    </div>
  );
}
