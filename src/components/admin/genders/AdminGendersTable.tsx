"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import type { AdminGenderListItem } from "@/hooks/useAdminGenders";
import type { PaginationInfo } from "@/types/pagination";
import { Icon } from "@iconify/react";

export interface AdminGendersTableProps {
  genders: AdminGenderListItem[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (gender: AdminGenderListItem) => void;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

type SortField = "slug" | "name";

function getGenderName(gender: AdminGenderListItem, locale: string): string {
  const translation = gender.translations.find((t) => t.language_code === locale);
  if (translation?.name) return translation.name;
  return gender.translations[0]?.name ?? gender.slug;
}

export function AdminGendersTable({
  genders,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  isLoading,
  currentSort,
  currentSearch = "",
}: AdminGendersTableProps) {
  const t = useTranslations("admin.genders");
  const locale = useLocale();
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

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

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("totalGenders", { count: pagination.totalCount })}
      </p>

      {isLoading ? (
        <AdminTableSkeleton columns={4} rows={8} />
      ) : genders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("noGenders")}</p>
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
                      onClick={() => handleSortClick("slug")}
                      aria-label={t("sortBy", { field: t("columns.slug") })}
                    >
                      {t("columns.slug")}
                      {renderSortIcon("slug")}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("name")}
                      aria-label={t("sortBy", { field: t("columns.name") })}
                    >
                      {t("columns.name")}
                      {renderSortIcon("name")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.characterCount")}
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
                {genders.map((gender) => (
                  <tr
                    key={gender.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => onEdit(gender.id)}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                      {gender.slug}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {getGenderName(gender, locale)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t("characterCount", { count: gender.characterCount })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(gender.id)}
                          aria-label={t("editGender", { name: getGenderName(gender, locale) })}
                        >
                          <Icon icon="fa:edit" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(gender)}
                          aria-label={t("deleteGender", { name: getGenderName(gender, locale) })}
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
