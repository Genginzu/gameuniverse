"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { PaginationButton } from "./PaginationButton";
import { MobilePageSelector } from "./MobilePageSelector";
import { getVisiblePages } from "./paginationUtils";

// Re-export for backward compatibility
export { getVisiblePages } from "./paginationUtils";

/**
 * Variantes visuelles supportées par le composant Pagination.
 *
 * - `default` : style legacy/admin (carte glassmorphism, gradient
 *   secondary→primary sur la page active). Conserve la compat avec les
 *   17 pages existantes (admin, library, characters, esport, coaching,
 *   coins, posts, players, upcoming…).
 * - `editorial` : style refonte éditoriale (surface sombre `--editorial-bg-2`,
 *   accent dynamique via `--accent-rgb`). À utiliser dans les listings
 *   refondus (cf. docs/design/editorial-refonte-plan.md).
 */
export type PaginationVariant = "default" | "editorial";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  translationNamespace?: string;
  /** Variante visuelle. Default: `"default"` (legacy). */
  variant?: PaginationVariant;
}

/**
 * Generic Pagination component that works for all entity types.
 * Supports configurable translation namespace for localized labels and
 * an editorial visual variant for refonte pages.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  loading = false,
  translationNamespace = "pagination",
  variant = "default",
}: PaginationProps) {
  const t = useTranslations(translationNamespace);

  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);

  if (variant === "editorial") {
    return (
      <div className="editorial-pagination">
        {/* Page info */}
        <div className="editorial-pagination-info">
          <span>
            {t("page")}{" "}
            <span className="editorial-pagination-info-current">
              {currentPage}
            </span>{" "}
            {t("of")}{" "}
            <span className="editorial-pagination-info-total">{totalPages}</span>
          </span>
          {totalCount > 0 && (
            <>
              <span aria-hidden className="editorial-pagination-info-separator">
                ·
              </span>
              <span>
                {totalCount} {totalCount === 1 ? t("result") : t("results")}
              </span>
            </>
          )}
        </div>

        {/* Pagination controls */}
        <div className="editorial-pagination-controls">
          {/* First page button */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            className="editorial-pagination-button is-edge"
            aria-label={t("first")}
          >
            <Icon icon="lucide:chevrons-left" className="size-4" />
            <span className="editorial-pagination-button-label">
              {t("first")}
            </span>
          </button>

          {/* Previous page button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="editorial-pagination-button"
            aria-label={t("previous")}
          >
            <Icon icon="lucide:chevron-left" className="size-4" />
            <span className="editorial-pagination-button-label">
              {t("previous")}
            </span>
          </button>

          {/* Page numbers */}
          {visiblePages.map((page, index) => (
            <PaginationButton
              key={page === "..." ? `dots-${index}` : page}
              page={page}
              currentPage={currentPage}
              loading={loading}
              onPageChange={onPageChange}
              variant="editorial"
            />
          ))}

          {/* Next page button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="editorial-pagination-button"
            aria-label={t("next")}
          >
            <span className="editorial-pagination-button-label">
              {t("next")}
            </span>
            <Icon icon="lucide:chevron-right" className="size-4" />
          </button>

          {/* Last page button */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="editorial-pagination-button is-edge"
            aria-label={t("last")}
          >
            <span className="editorial-pagination-button-label">
              {t("last")}
            </span>
            <Icon icon="lucide:chevrons-right" className="size-4" />
          </button>
        </div>

        {/* Mobile-friendly page selector dropdown */}
        <MobilePageSelector
          currentPage={currentPage}
          totalPages={totalPages}
          loading={loading}
          onPageChange={onPageChange}
          labels={{ goToPage: t("goToPage"), of: t("of") }}
          variant="editorial"
        />
      </div>
    );
  }

  // Default (legacy) variant
  return (
    <div className="flex flex-col items-center space-y-4 rounded-2xl bg-white p-4 shadow-xs sm:space-y-6 sm:p-6 dark:bg-gray-800">
      {/* Page info */}
      <div className="flex flex-col items-center space-y-2 text-sm sm:flex-row sm:space-y-0 sm:space-x-2">
        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
          <span>{t("page")}</span>
          <span className="text-palette-secondary-500 dark:text-palette-secondary-400 font-semibold">
            {currentPage}
          </span>
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
          className="hover:border-palette-primary-300 hover:bg-palette-primary-50 hover:text-palette-primary-600 dark:hover:border-palette-primary-500 dark:hover:bg-palette-primary-900/20 hidden rounded-lg border-gray-200 px-2 py-2 text-sm font-medium transition-all disabled:opacity-50 md:inline-flex md:px-3 dark:border-gray-700"
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
          className="hover:border-palette-primary-300 hover:bg-palette-primary-50 hover:text-palette-primary-600 dark:hover:border-palette-primary-500 dark:hover:bg-palette-primary-900/20 min-h-[44px] rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 sm:px-4 dark:border-gray-700"
        >
          <Icon icon="lucide:chevron-left" className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t("previous")}</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => (
            <PaginationButton
              key={page === "..." ? `dots-${index}` : page}
              page={page}
              currentPage={currentPage}
              loading={loading}
              onPageChange={onPageChange}
            />
          ))}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="hover:border-palette-primary-300 hover:bg-palette-primary-50 hover:text-palette-primary-600 dark:hover:border-palette-primary-500 dark:hover:bg-palette-primary-900/20 min-h-[44px] rounded-lg border-gray-200 px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 sm:px-4 dark:border-gray-700"
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
          className="hover:border-palette-primary-300 hover:bg-palette-primary-50 hover:text-palette-primary-600 dark:hover:border-palette-primary-500 dark:hover:bg-palette-primary-900/20 hidden rounded-lg border-gray-200 px-2 py-2 text-sm font-medium transition-all disabled:opacity-50 md:inline-flex md:px-3 dark:border-gray-700"
        >
          <span className="hidden md:inline">{t("last")}</span>
          <Icon icon="lucide:chevrons-right" className="h-4 w-4 md:ml-1" />
        </Button>
      </div>

      {/* Mobile-friendly page selector dropdown */}
      <MobilePageSelector
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        onPageChange={onPageChange}
        labels={{ goToPage: t("goToPage"), of: t("of") }}
      />
    </div>
  );
}
