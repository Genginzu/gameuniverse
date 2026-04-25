"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationMissingItem, PaginationInfo } from "@/types/admin-translations";
import { TranslationTableRow } from "./TranslationTableRow";
import { TranslationPagination, TranslationSkeletonRow } from "./TranslationTableParts";

type LinkHref = { pathname: string; query: Record<string, string> };

interface TranslationTableProps {
  items: TranslationMissingItem[];
  pagination: PaginationInfo;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
  onTranslate: (item: TranslationMissingItem) => void;
  onTranslateAndReview: (item: TranslationMissingItem) => void;
  rowHref: (item: TranslationMissingItem) => string;
  buildPageUrl: (page: number) => LinkHref;
  buildSearchUrl: (query: string) => LinkHref;
  currentSearch: string;
  isLoading: boolean;
  translatingIds: Set<string>;
}

export function TranslationTable({
  items,
  pagination,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onTranslate,
  onTranslateAndReview,
  rowHref,
  buildPageUrl,
  buildSearchUrl,
  currentSearch,
  isLoading,
  translatingIds,
}: TranslationTableProps) {
  const t = useTranslations("admin.translations");
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.entityId));
  const hasSelection = selectedIds.size > 0;

  const handleSearchSubmit = () => {
    const href = buildSearchUrl(searchValue);
    router.push({ pathname: href.pathname, query: href.query } as never);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearchSubmit();
  };
  const handleSelectAllToggle = () => {
    if (allSelected) onClearSelection();
    else onSelectAll(items.map((i) => i.entityId));
  };

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Icon
            icon="mdi:magnify"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("table.searchPlaceholder")}
            className="glass-input w-full rounded-lg py-2 pr-3 pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">
              {t("table.selected", { count: selectedIds.size })}
            </span>
          )}
          {hasSelection && (
            <button
              onClick={() => {
                items.filter((i) => selectedIds.has(i.entityId)).forEach(onTranslate);
              }}
              className="from-palette-secondary-500 to-palette-primary-500 inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:opacity-90"
            >
              <Icon icon="mdi:translate" className="size-4" />
              {t("buttons.translateSelection")}
            </button>
          )}
          <button
            onClick={() => items.forEach(onTranslate)}
            className="border-palette-secondary-500/30 text-palette-secondary-600 hover:bg-palette-secondary-50 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/20 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-300"
          >
            <Icon icon="mdi:translate-variant" className="size-4" />
            {t("buttons.translateAll")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400">
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAllToggle}
                  className="text-palette-secondary-500 focus:ring-palette-secondary-500 size-4 rounded border-gray-300 dark:border-slate-600"
                  aria-label={t("table.selectAll")}
                />
              </th>
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">{t("table.source")}</th>
              <th className="px-3 py-3">{t("table.sourceLang")}</th>
              <th className="px-3 py-3">{t("table.missingLangs")}</th>
              <th className="px-3 py-3">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <TranslationSkeletonRow key={i} />)
              : items.map((item) => (
                  <TranslationTableRow
                    key={item.entityId}
                    item={item}
                    isSelected={selectedIds.has(item.entityId)}
                    isTranslating={translatingIds.has(item.entityId)}
                    href={rowHref(item)}
                    onToggleSelect={onToggleSelect}
                    onTranslate={onTranslate}
                    onTranslateAndReview={onTranslateAndReview}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <Icon icon="mdi:translate-off" className="mb-3 size-10 opacity-40" />
          <p className="text-sm">{t("table.noResults")}</p>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <TranslationPagination pagination={pagination} buildPageUrl={buildPageUrl} t={t} />
      )}
    </div>
  );
}
