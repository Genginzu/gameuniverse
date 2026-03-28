"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

interface WebhookPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function WebhookPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: WebhookPaginationProps) {
  const t = useTranslations("webhooks");

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("pagination.total", { count: total })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <Icon icon="lucide:chevron-left" className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {t("pagination.page", { current: page, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <Icon icon="lucide:chevron-right" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
