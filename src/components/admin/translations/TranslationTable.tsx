"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type {
  TranslationMissingItem,
  TranslationListStatus,
  PaginationInfo,
} from "@/types/admin-translations";
import { TranslationTableRow } from "./TranslationTableRow";
import { TranslationCompleteRow } from "./TranslationCompleteRow";
import {
  TranslationBulkActions,
  TranslationPagination,
  TranslationSkeletonRow,
} from "./TranslationTableParts";

type LinkHref = { pathname: string; query: Record<string, string> };

interface TranslationTableProps {
  status?: TranslationListStatus;
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
  status = "missing", items, pagination, selectedIds, onToggleSelect, onSelectAll,
  onClearSelection, onTranslate, onTranslateAndReview, rowHref, buildPageUrl, buildSearchUrl,
  currentSearch, isLoading, translatingIds,
}: TranslationTableProps) {
  const t = useTranslations("admin.translations");
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const isMissing = status === "missing";

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.entityId));

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
          <Icon icon="mdi:magnify" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("table.searchPlaceholder")} className="glass-input w-full rounded-lg py-2 pr-3 pl-9 text-base sm:text-sm" />
        </div>
        {isMissing && (
          <TranslationBulkActions
            selectedCount={selectedIds.size}
            onTranslateSelection={() => items.filter((i) => selectedIds.has(i.entityId)).forEach(onTranslate)}
            onTranslateAll={() => items.forEach(onTranslate)}
            t={t}
          />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400">
              {isMissing && (
                <th className="px-3 py-3">
                  <input type="checkbox" checked={allSelected} onChange={handleSelectAllToggle} className="text-palette-secondary-500 focus:ring-palette-secondary-500 size-4 rounded border-gray-300 dark:border-slate-600" aria-label={t("table.selectAll")} />
                </th>
              )}
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">{t("table.source")}</th>
              <th className="px-3 py-3">{t("table.sourceLang")}</th>
              <th className="px-3 py-3">{isMissing ? t("table.missingLangs") : t("table.status")}</th>
              <th className="px-3 py-3">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <TranslationSkeletonRow key={i} columns={isMissing ? 6 : 5} />)
              : items.map((item) =>
                  isMissing ? (
                    <TranslationTableRow key={item.entityId} item={item} isSelected={selectedIds.has(item.entityId)} isTranslating={translatingIds.has(item.entityId)} href={rowHref(item)} onToggleSelect={onToggleSelect} onTranslate={onTranslate} onTranslateAndReview={onTranslateAndReview} />
                  ) : (
                    <TranslationCompleteRow key={item.entityId} item={item} href={rowHref(item)} />
                  )
                )}
          </tbody>
        </table>
      </div>

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <Icon icon={isMissing ? "mdi:check-all" : "mdi:translate-off"} className="mb-3 size-10 opacity-40" />
          <p className="text-sm">{isMissing ? t("table.noMissing") : t("table.noComplete")}</p>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <TranslationPagination pagination={pagination} buildPageUrl={buildPageUrl} t={t} />
      )}
    </div>
  );
}
