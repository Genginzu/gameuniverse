"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import type { PaginationInfo } from "@/types/pagination";

interface AdminTablePaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function AdminTablePagination({ pagination, onPageChange, t }: AdminTablePaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("page", { current: pagination.currentPage, total: pagination.totalPages })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasPreviousPage}
          className="min-h-[44px] min-w-[44px]"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          aria-label={t("previousPage")}
        >
          <Icon icon="fa:chevron-left" className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasNextPage}
          className="min-h-[44px] min-w-[44px]"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          aria-label={t("nextPage")}
        >
          <Icon icon="fa:chevron-right" className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
