"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { Icon } from "@iconify/react";
import type { PaginationInfo } from "@/types/pagination";

export interface AdminColumnDef<T> {
  key: string;
  labelKey: string;
  sortable?: boolean;
  /** Custom render function. Falls back to item[key] */
  render?: (item: T) => React.ReactNode;
  /** Additional className for the td */
  className?: string;
}

interface AdminDataTableProps<T> {
  items: T[];
  columns: AdminColumnDef<T>[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch?: string;
  /** i18n namespace for search/pagination/empty labels */
  translationNamespace: string;
  /** Key for the item's unique identifier */
  idField?: keyof T;
  /** Number of skeleton columns (defaults to columns.length + 1 for actions) */
  skeletonColumns?: number;
  /** i18n key for total count (default: "totalCount") */
  totalCountKey?: string;
  /** i18n key for empty state (default: "empty") */
  emptyKey?: string;
}

export function AdminDataTable<T>({
  items,
  columns,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  isLoading,
  currentSort,
  currentSearch = "",
  translationNamespace,
  idField = "id" as keyof T,
  skeletonColumns,
  totalCountKey = "totalCount",
  emptyKey = "empty",
}: AdminDataTableProps<T>) {
  const t = useTranslations(translationNamespace);
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleSortClick = (field: string) => {
    const newOrder =
      currentSort?.field === field && currentSort.order === "asc" ? "desc" : "asc";
    onSort(field, newOrder);
  };

  const renderSortIcon = (field: string) => {
    if (currentSort?.field !== field)
      return <Icon icon="fa:sort" className="h-3 w-3 opacity-40" />;
    return currentSort.order === "asc" ? (
      <Icon icon="fa:sort-up" className="h-3 w-3" />
    ) : (
      <Icon icon="fa:sort-down" className="h-3 w-3" />
    );
  };

  const colCount = skeletonColumns ?? columns.length + 1;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Icon
            icon="fa:search"
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("search")}
        </Button>
      </form>

      {/* Total count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">{t(totalCountKey, { count: pagination.totalCount })}</p>

      {/* Loading / Empty / Table */}
      {isLoading ? (
        <AdminTableSkeleton columns={colCount} rows={8} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t(emptyKey)}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} scope="col" className="px-4 py-3">
                      {col.sortable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                          onClick={() => handleSortClick(col.key)}
                          aria-label={t("sortBy", { field: t(col.labelKey) })}
                        >
                          {t(col.labelKey)}
                          {renderSortIcon(col.key)}
                        </button>
                      ) : (
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          {t(col.labelKey)}
                        </span>
                      )}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {items.map((item) => (
                  <tr
                    key={String(item[idField])}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => onEdit(item)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={col.className ?? "px-4 py-3 text-gray-900 dark:text-white"}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          aria-label={t("edit")}
                        >
                          <Icon icon="fa:edit" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item)}
                          aria-label={t("delete")}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Icon icon="fa:trash" className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
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
          )}
        </>
      )}
    </div>
  );
}
