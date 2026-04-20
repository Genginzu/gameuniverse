"use client";

import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import type { PaginationInfo } from "@/types/admin-translations";

type LinkHref = { pathname: string; query: Record<string, string> };

export function TranslationPagination({
  pagination, buildPageUrl, t,
}: {
  pagination: PaginationInfo;
  buildPageUrl: (page: number) => LinkHref;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}) {
  const { currentPage, totalPages } = pagination;

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
      <span className="text-xs text-gray-500 dark:text-gray-400">{t("table.page", { current: currentPage, total: totalPages })}</span>
      <div className="flex items-center gap-1">
        {pagination.hasPreviousPage ? (
          <Link href={buildPageUrl(currentPage - 1)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 transition-all duration-300 hover:bg-white/20 dark:text-gray-300 dark:hover:bg-slate-700/40">
            <Icon icon="mdi:chevron-left" className="size-4" />{t("table.previous")}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 opacity-40 dark:text-gray-300"><Icon icon="mdi:chevron-left" className="size-4" />{t("table.previous")}</span>
        )}
        {pagination.hasNextPage ? (
          <Link href={buildPageUrl(currentPage + 1)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 transition-all duration-300 hover:bg-white/20 dark:text-gray-300 dark:hover:bg-slate-700/40">
            {t("table.next")}<Icon icon="mdi:chevron-right" className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 opacity-40 dark:text-gray-300">{t("table.next")}<Icon icon="mdi:chevron-right" className="size-4" /></span>
        )}
      </div>
    </div>
  );
}

export function TranslationSkeletonRow() {
  return (
    <tr className="border-b border-white/10">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-3 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-slate-700" /></td>
      ))}
    </tr>
  );
}
