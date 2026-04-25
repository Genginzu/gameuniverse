"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface TranslationTableActionsProps {
  selectedCount: number;
  hasItems: boolean;
  isBusy: boolean;
  onSearch: (query: string) => void;
  onTranslateSelection: () => void;
  onTranslateAll: () => void;
}

export function TranslationTableActions({
  selectedCount,
  hasItems,
  isBusy,
  onSearch,
  onTranslateSelection,
  onTranslateAll,
}: TranslationTableActionsProps) {
  const t = useTranslations("admin.translations");
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="relative">
          <Icon
            icon="mdi:magnify"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("table.searchPlaceholder")}
            className="glass-input w-full rounded-xl py-2 pr-3 pl-9 text-sm"
          />
        </div>
      </form>

      {selectedCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t("table.selected", { count: selectedCount })}
        </span>
      )}

      <button
        onClick={onTranslateSelection}
        disabled={selectedCount === 0 || isBusy}
        className="from-palette-secondary-500 to-palette-primary-500 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r px-3 py-2 text-xs font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-40"
      >
        <Icon icon="mdi:translate" className="size-4" />
        {t("buttons.translateSelection")}
      </button>

      <button
        onClick={onTranslateAll}
        disabled={!hasItems || isBusy}
        className="border-palette-secondary-500/30 text-palette-secondary-600 hover:bg-palette-secondary-50 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/20 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-300 disabled:opacity-40"
      >
        <Icon icon="mdi:translate-variant" className="size-4" />
        {t("buttons.translateAll")}
      </button>
    </div>
  );
}
