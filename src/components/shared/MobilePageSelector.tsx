interface MobilePageSelectorProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  labels: { goToPage: string; of: string };
}

export function MobilePageSelector({
  currentPage,
  totalPages,
  loading,
  onPageChange,
  labels,
}: MobilePageSelectorProps) {
  return (
    <div className="flex items-center space-x-3 sm:hidden">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {labels.goToPage}
      </span>
      <select
        value={currentPage}
        onChange={(e) => onPageChange(parseInt(e.target.value))}
        disabled={loading}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base font-medium shadow-xs focus:border-palette-primary-500 focus:ring-2 focus:ring-palette-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
