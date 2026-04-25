"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTablePagination } from "@/components/admin/shared/AdminTablePagination";
import type { AdminRatingSystem } from "@/types/admin-age-classifications";
import type { PaginationInfo } from "@/types/pagination";
import { Icon } from "@iconify/react";

export interface RatingSystemsTableProps {
  systems: AdminRatingSystem[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (system: AdminRatingSystem) => void;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

type SortField = "code" | "name";

export function RatingSystemsTable({
  systems,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  isLoading,
  currentSort,
  currentSearch = "",
}: RatingSystemsTableProps) {
  const t = useTranslations("admin.ageClassifications");

  const handleSortClick = (field: SortField) => {
    const newOrder = currentSort?.field === field && currentSort.order === "asc" ? "desc" : "asc";
    onSort(field, newOrder);
  };
  const renderSortIcon = (field: SortField) => {
    if (currentSort?.field !== field) return <Icon icon="fa:sort" className="h-3 w-3 opacity-40" />;
    return currentSort.order === "asc" ? (
      <Icon icon="fa:sort-up" className="h-3 w-3" />
    ) : (
      <Icon icon="fa:sort-down" className="h-3 w-3" />
    );
  };

  return (
    <div className="space-y-4">
      <AdminSearchBar
        currentSearch={currentSearch}
        onSearch={onSearch}
        placeholder={t("searchPlaceholder")}
        buttonLabel={t("search")}
      />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("totalSystems", { count: pagination.totalCount })}
      </p>

      {isLoading ? (
        <AdminTableSkeleton columns={3} rows={6} />
      ) : systems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("noSystems")}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("code")}
                    >
                      {t("columns.code")}
                      {renderSortIcon("code")}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("name")}
                    >
                      {t("columns.name")}
                      {renderSortIcon("name")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.countries")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.website")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {systems.map((system) => (
                  <tr
                    key={system.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => onEdit(system.id)}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                      {system.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {system.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {system.country_codes?.length ? system.country_codes.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {system.website_url ? (
                        <a
                          href={system.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon icon="lucide:external-link" className="h-3 w-3" />
                          {t("link")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(system.id)}
                          aria-label={t("edit", { name: system.name })}
                        >
                          <Icon icon="fa:edit" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(system)}
                          aria-label={t("delete", { name: system.name })}
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
          <AdminTablePagination pagination={pagination} onPageChange={onPageChange} t={t} />
        </>
      )}
    </div>
  );
}
