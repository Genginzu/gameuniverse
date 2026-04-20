"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  translationNamespace?: string;
}

/**
 * Generic Pagination component that works for all entity types.
 * Supports configurable translation namespace for localized labels.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  loading = false,
  translationNamespace = "pagination",
}: PaginationProps) {
  const t = useTranslations(translationNamespace);

  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = (): (number | string)[] => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push("...");
      }
    }

    rangeWithDots.push(...range);

    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push("...");
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col items-center space-y-4 rounded-2xl bg-white p-4 shadow-xs sm:space-y-6 sm:p-6 dark:bg-gray-800">
      {/* Page info */}
      <div className="flex flex-col items-center space-y-2 text-sm sm:flex-row sm:space-y-0 sm:space-x-2">
        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
          <span>{t("page")}</span>
          <span className="font-semibold text-cyan-500 dark:text-cyan-400">{currentPage}</span>
          <span>{t("of")}</span>
          <span className="font-semibold">{totalPages}</span>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
            <span className="hidden sm:inline">•</span>
            <span>
              {totalCount} {totalCount === 1 ? t("result") : t("results")}
            </span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* First page button - hidden on mobile */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          className="hidden rounded-lg border-gray-200 px-2 py-2 text-sm font-medium transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50 md:inline-flex md:px-3 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
        >
          <Icon icon="lucide:chevrons-left" className="h-4 w-4 md:mr-1" />
          <span className="hidden md:inline">{t("first")}</span>
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="min-h-[44px] rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50 sm:px-4 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
        >
          <Icon icon="lucide:chevron-left" className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t("previous")}</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`dots-${index}`} className="px-2 py-2 text-gray-400 sm:px-3">
                  <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
                </span>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                disabled={loading}
                className={`h-10 min-w-[44px] rounded-lg font-medium transition-all sm:h-10 sm:min-w-[44px] ${
                  isCurrentPage
                    ? "pointer-events-none bg-linear-to-r from-cyan-500 to-violet-500 text-white shadow-lg"
                    : "border-gray-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
                }`}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="min-h-[44px] rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50 sm:px-4 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
        >
          <span className="hidden sm:inline">{t("next")}</span>
          <Icon icon="lucide:chevron-right" className="h-4 w-4 sm:ml-2" />
        </Button>

        {/* Last page button - hidden on mobile */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="hidden rounded-lg border-gray-200 px-2 py-2 text-sm font-medium transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50 md:inline-flex md:px-3 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
        >
          <span className="hidden md:inline">{t("last")}</span>
          <Icon icon="lucide:chevrons-right" className="h-4 w-4 md:ml-1" />
        </Button>
      </div>

      {/* Mobile-friendly page selector dropdown */}
      <div className="flex items-center space-x-3 sm:hidden">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("goToPage")}
        </span>
        <select
          value={currentPage}
          onChange={(e) => onPageChange(parseInt(e.target.value))}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base font-medium shadow-xs focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t("of")} {totalPages}
        </span>
      </div>
    </div>
  );
}

/**
 * Helper function to calculate visible pages with ellipsis.
 * Exported for testing purposes.
 */
export function getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];

  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (start > 1) {
    rangeWithDots.push(1);
    if (start > 2) {
      rangeWithDots.push("...");
    }
  }

  rangeWithDots.push(...range);

  if (end < totalPages) {
    if (end < totalPages - 1) {
      rangeWithDots.push("...");
    }
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}
