import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

interface PaginationButtonProps {
  page: number | string;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function PaginationButton({ page, currentPage, loading, onPageChange }: PaginationButtonProps) {
  if (page === "...") {
    return (
      <span className="px-2 py-2 text-gray-400 sm:px-3">
        <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
      </span>
    );
  }

  const pageNumber = page as number;
  const isCurrentPage = pageNumber === currentPage;

  return (
    <Button
      variant={isCurrentPage ? "default" : "outline"}
      size="sm"
      onClick={() => onPageChange(pageNumber)}
      disabled={loading}
      className={`h-10 min-w-[44px] rounded-lg font-medium transition-all sm:h-10 sm:min-w-[44px] ${
        isCurrentPage
          ? "pointer-events-none bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white shadow-lg"
          : "border-gray-200 hover:border-palette-primary-300 hover:bg-palette-primary-50 hover:text-palette-primary-600 dark:border-gray-700 dark:hover:border-palette-primary-500 dark:hover:bg-palette-primary-900/20"
      }`}
    >
      {pageNumber}
    </Button>
  );
}
