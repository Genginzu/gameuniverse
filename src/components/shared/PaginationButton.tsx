import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import type { PaginationVariant } from "./Pagination";

interface PaginationButtonProps {
  page: number | string;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  /** Variante visuelle. Default: `"default"` (legacy). */
  variant?: PaginationVariant;
}

export function PaginationButton({
  page,
  currentPage,
  loading,
  onPageChange,
  variant = "default",
}: PaginationButtonProps) {
  if (page === "...") {
    if (variant === "editorial") {
      return (
        <span
          className="text-editorial-muted inline-flex min-w-8 items-center justify-center px-2"
          aria-hidden
        >
          <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
        </span>
      );
    }
    return (
      <span className="px-2 py-2 text-gray-400 sm:px-3">
        <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
      </span>
    );
  }

  const pageNumber = page as number;
  const isCurrentPage = pageNumber === currentPage;

  if (variant === "editorial") {
    return (
      <button
        type="button"
        onClick={() => onPageChange(pageNumber)}
        disabled={loading || isCurrentPage}
        className={`inline-flex min-h-10 min-w-11 items-center justify-center rounded-lg border px-2.5 text-sm font-semibold transition ${
          isCurrentPage
            ? "from-editorial-accent to-editorial-accent/75 border-editorial-accent/90 pointer-events-none bg-gradient-to-br text-white shadow-[0_0_0_1px_rgba(var(--accent-rgb,var(--neon-primary)),0.35),0_0_16px_rgba(var(--accent-rgb,var(--neon-primary)),0.45)]"
            : "border-editorial-line text-editorial-muted hover:not-disabled:bg-editorial-accent/10 hover:not-disabled:border-editorial-accent/40 hover:not-disabled:text-white disabled:cursor-not-allowed disabled:opacity-40"
        }`}
        aria-current={isCurrentPage ? "page" : undefined}
      >
        {pageNumber}
      </button>
    );
  }

  return (
    <Button
      variant={isCurrentPage ? "default" : "outline"}
      size="sm"
      onClick={() => onPageChange(pageNumber)}
      disabled={loading}
      className={`h-10 min-w-[44px] rounded-lg font-medium transition-all sm:h-10 sm:min-w-[44px] ${
        isCurrentPage
          ? "from-palette-secondary-500 to-palette-primary-500 pointer-events-none bg-linear-to-r text-white shadow-lg"
          : "hover:border-palette-primary-300 hover:bg-palette-primary-50 hover:text-palette-primary-600 dark:hover:border-palette-primary-500 dark:hover:bg-palette-primary-900/20 border-gray-200 dark:border-gray-700"
      }`}
    >
      {pageNumber}
    </Button>
  );
}
