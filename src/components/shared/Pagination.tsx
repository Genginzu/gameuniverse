"use client";

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
 *
 * @example
 * // For games (uses default "pagination" namespace)
 * <Pagination currentPage={1} totalPages={10} totalCount={100} onPageChange={setPage} />
 *
 * // For players (uses "players.pagination" namespace)
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   totalCount={100}
 *   onPageChange={setPage}
 *   translationNamespace="players.pagination"
 * />
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
    const delta = 2; // Number of pages to show on each side of current page
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Calculate the range of pages to show
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if needed
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push("...");
      }
    }

    // Add the main range
    rangeWithDots.push(...range);

    // Add last page and dots if needed
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
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
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
          <svg className="h-4 w-4 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
          <span className="hidden md:inline">{t("first")}</span>
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50 sm:px-4 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
        >
          <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">{t("previous")}</span>
        </Button>

        {/* Page numbers - fewer on mobile */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`dots-${index}`} className="px-2 py-2 text-gray-400 sm:px-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h.01M12 12h.01M19 12h.01"
                    />
                  </svg>
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
          className="rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50 sm:px-4 dark:border-gray-700 dark:hover:border-violet-500 dark:hover:bg-violet-900/20"
        >
          <span className="hidden sm:inline">{t("next")}</span>
          <svg className="h-4 w-4 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
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
          <svg className="h-4 w-4 md:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
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
