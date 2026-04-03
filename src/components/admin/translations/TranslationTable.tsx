"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationMissingItem, PaginationInfo } from "@/types/admin-translations";
import { TranslationTableRow } from "./TranslationTableRow";

/** Href object compatible with next-intl Link. */
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
  /** Build the href for a given page number. */
  buildPageUrl: (page: number) => LinkHref;
  /** Build the href for a search query (resets to page 1). */
  buildSearchUrl: (query: string) => LinkHref;
  /** Current search value from URL. */
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
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll(items.map((i) => i.entityId));
    }
  };

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Toolbar: search + action buttons */}
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {hasSelection && (
            <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">
              {t("table.selected", { count: selectedIds.size })}
            </span>
          )}
          {hasSelection && (
            <button
              onClick={() => {
                const selected = items.filter((i) => selectedIds.has(i.entityId));
                selected.forEach(onTranslate);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:opacity-90"
            >
              <Icon icon="mdi:translate" className="size-4" />
              {t("buttons.translateSelection")}
            </button>
          )}
          <button
            onClick={() => items.forEach(onTranslate)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 px-3 py-1.5 text-xs font-medium text-cyan-600 transition-all duration-300 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
          >
            <Icon icon="mdi:translate-variant" className="size-4" />
            {t("buttons.translateAll")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400">
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAllToggle}
                  className="size-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 dark:border-slate-600"
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
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
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

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <Icon icon="mdi:translate-off" className="mb-3 size-10 opacity-40" />
          <p className="text-sm">{t("table.noResults")}</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination pagination={pagination} buildPageUrl={buildPageUrl} t={t} />
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-white/10">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        </td>
      ))}
    </tr>
  );
}

function Pagination({
  pagination,
  buildPageUrl,
  t,
}: {
  pagination: PaginationInfo;
  buildPageUrl: (page: number) => LinkHref;
  t: ReturnType<typeof useTranslations>;
}) {
  const { currentPage, totalPages } = pagination;

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {t("table.page", { current: currentPage, total: totalPages })}
      </span>
      <div className="flex items-center gap-1">
        {pagination.hasPreviousPage ? (
          <Link
            href={buildPageUrl(currentPage - 1)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 transition-all duration-300 hover:bg-white/20 dark:text-gray-300 dark:hover:bg-slate-700/40"
          >
            <Icon icon="mdi:chevron-left" className="size-4" />
            {t("table.previous")}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 opacity-40 dark:text-gray-300">
            <Icon icon="mdi:chevron-left" className="size-4" />
            {t("table.previous")}
          </span>
        )}
        {pagination.hasNextPage ? (
          <Link
            href={buildPageUrl(currentPage + 1)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 transition-all duration-300 hover:bg-white/20 dark:text-gray-300 dark:hover:bg-slate-700/40"
          >
            {t("table.next")}
            <Icon icon="mdi:chevron-right" className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 opacity-40 dark:text-gray-300">
            {t("table.next")}
            <Icon icon="mdi:chevron-right" className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}
