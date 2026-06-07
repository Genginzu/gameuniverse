import type { PaginationVariant } from "./Pagination";

interface MobilePageSelectorProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  labels: { goToPage: string; of: string };
  /** Variante visuelle. Default: `"default"` (legacy). */
  variant?: PaginationVariant;
}

export function MobilePageSelector({
  currentPage,
  totalPages,
  loading,
  onPageChange,
  labels,
  variant = "default",
}: MobilePageSelectorProps) {
  if (variant === "editorial") {
    return (
      <div className="flex items-center gap-3 sm:hidden">
        <span className="text-sm font-medium text-white">{labels.goToPage}</span>
        <select
          value={currentPage}
          onChange={(e) => onPageChange(parseInt(e.target.value))}
          disabled={loading}
          className="bg-editorial-3 border-editorial-line focus:border-editorial-accent cursor-pointer rounded-lg border px-3 py-2 text-base font-medium text-white focus:shadow-[0_0_0_2px_rgba(var(--accent-rgb,var(--neon-primary)),0.2)] focus:outline-none"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span className="text-editorial-muted text-sm">
          {labels.of} {totalPages}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 sm:hidden">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {labels.goToPage}
      </span>
      <select
        value={currentPage}
        onChange={(e) => onPageChange(parseInt(e.target.value))}
        disabled={loading}
        className="focus:border-palette-primary-500 focus:ring-palette-primary-500/20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base font-medium shadow-xs focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <option key={page} value={page}>
            {page}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {labels.of} {totalPages}
      </span>
    </div>
  );
}
