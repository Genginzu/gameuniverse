"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTablePagination } from "@/components/admin/shared/AdminTablePagination";
import { Icon } from "@iconify/react";
import type { PaginationInfo } from "@/types/pagination";

export interface AdminColumnDef<T> {
  key: string;
  labelKey: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
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
  translationNamespace: string;
  idField?: keyof T;
  skeletonColumns?: number;
  totalCountKey?: string;
  emptyKey?: string;
}

export function AdminDataTable<T>({
  items, columns, pagination, onPageChange, onSearch, onSort, onEdit, onDelete,
  isLoading, currentSort, currentSearch = "", translationNamespace,
  idField = "id" as keyof T, skeletonColumns, totalCountKey = "totalCount", emptyKey = "empty",
}: AdminDataTableProps<T>) {
  const t = useTranslations(translationNamespace);

  const handleSortClick = (field: string) => { const newOrder = currentSort?.field === field && currentSort.order === "asc" ? "desc" : "asc"; onSort(field, newOrder); };
  const renderSortIcon = (field: string) => { if (currentSort?.field !== field) return <Icon icon="fa:sort" className="h-3 w-3 opacity-40" />; return currentSort.order === "asc" ? <Icon icon="fa:sort-up" className="h-3 w-3" /> : <Icon icon="fa:sort-down" className="h-3 w-3" />; };

  const colCount = skeletonColumns ?? columns.length + 1;

  return (
    <div className="space-y-4">
      <AdminSearchBar currentSearch={currentSearch} onSearch={onSearch} placeholder={t("searchPlaceholder")} buttonLabel={t("search")} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{t(totalCountKey, { count: pagination.totalCount })}</p>

      {isLoading ? <AdminTableSkeleton columns={colCount} rows={8} /> : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800"><p className="text-gray-500 dark:text-gray-400">{t(emptyKey)}</p></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} scope="col" className="px-4 py-3">
                      {col.sortable ? (
                        <button type="button" className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" onClick={() => handleSortClick(col.key)}>{t(col.labelKey)}{renderSortIcon(col.key)}</button>
                      ) : (
                        <span className="font-medium text-gray-600 dark:text-gray-300">{t(col.labelKey)}</span>
                      )}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {items.map((item) => (
                  <tr key={String(item[idField])} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => onEdit(item)}>
                    {columns.map((col) => (
                      <td key={col.key} className={col.className ?? "px-4 py-3 text-gray-900 dark:text-white"}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)} aria-label={t("edit")}><Icon icon="fa:edit" className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(item)} aria-label={t("delete")} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><Icon icon="fa:trash" className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminTablePagination pagination={pagination} onPageChange={onPageChange} t={t} />
        </>
      )}
    </div>
  );
}
