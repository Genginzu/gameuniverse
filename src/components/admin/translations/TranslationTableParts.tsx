"use client";

import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import type { PaginationInfo } from "@/types/admin-translations";

type LinkHref = { pathname: string; query: Record<string, string> };

export function TranslationPagination({
  pagination,
  buildPageUrl,
  t,
}: {
  pagination: PaginationInfo;
  buildPageUrl: (page: number) => LinkHref;
  t: ReturnType<typeof import("next-intl").useTranslations>;
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

export function TranslationSkeletonRow({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/10">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        </td>
      ))}
    </tr>
  );
}

/** Bulk actions of the "to translate" tab: translate the selection or the whole page. */
export function TranslationBulkActions({
  selectedCount,
  onTranslateSelection,
  onTranslateAll,
  t,
}: {
  selectedCount: number;
  onTranslateSelection: () => void;
  onTranslateAll: () => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedCount > 0 && (
        <>
          <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">
            {t("table.selected", { count: selectedCount })}
          </span>
          <button
            onClick={onTranslateSelection}
            className="btn-filled inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all duration-300"
          >
            <Icon icon="mdi:translate" className="size-4" />
            {t("buttons.translateSelection")}
          </button>
        </>
      )}
      <button
        onClick={onTranslateAll}
        className="border-palette-secondary-500/30 text-palette-secondary-600 hover:bg-palette-secondary-50 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/20 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-300"
      >
        <Icon icon="mdi:translate-variant" className="size-4" />
        {t("buttons.translateAll")}
      </button>
    </div>
  );
}
