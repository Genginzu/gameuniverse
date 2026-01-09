"use client";

import { Button } from "@/components/ui/button";

interface GamePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function GamePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  loading = false,
}: GamePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

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
    <div className="flex flex-col items-center space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:space-y-6 sm:p-6">
      {/* Page info */}
      <div className="flex flex-col items-center space-y-2 text-sm sm:flex-row sm:space-x-2 sm:space-y-0">
        <div className="flex items-center space-x-1 text-gray-600">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Page</span>
          <span className="font-semibold text-blue-600">{currentPage}</span>
          <span>sur</span>
          <span className="font-semibold">{totalPages}</span>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center space-x-1 text-gray-500">
            <span className="hidden sm:inline">•</span>
            <span>
              {totalCount} {totalCount === 1 ? "résultat" : "résultats"}
            </span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* First page button - hidden on mobile */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          className="hidden rounded-lg border-gray-200 px-2 py-2 text-sm font-medium transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 md:inline-flex md:px-3"
        >
          <svg className="h-4 w-4 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
          <span className="hidden md:inline">Premier</span>
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 sm:px-4"
        >
          <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Précédent</span>
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
                className={`h-9 min-w-[36px] rounded-lg font-medium transition-all sm:h-10 sm:min-w-[44px] ${
                  isCurrentPage
                    ? "pointer-events-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
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
          className="rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 sm:px-4"
        >
          <span className="hidden sm:inline">Suivant</span>
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
          className="hidden rounded-lg border-gray-200 px-2 py-2 text-sm font-medium transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 md:inline-flex md:px-3"
        >
          <span className="hidden md:inline">Dernier</span>
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

      {/* Mobile-friendly page input */}
      <div className="flex items-center space-x-3 sm:hidden">
        <span className="text-sm font-medium text-gray-700">Aller à la page:</span>
        <select
          value={currentPage}
          onChange={(e) => onPageChange(parseInt(e.target.value))}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">sur {totalPages}</span>
      </div>
    </div>
  );
}
