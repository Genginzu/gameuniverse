"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";

import type { AdminAchievement } from "@/types/admin-achievements";
import type { PaginationInfo } from "@/types/pagination";
import { Icon } from "@iconify/react";

export interface AchievementsTableProps {
  achievements: AdminAchievement[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (achievement: AdminAchievement) => void;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

type SortField = "key" | "category" | "tier" | "threshold" | "xp_value" | "name";

/** Resolve the achievement name for the current locale */
function getAchievementName(achievement: AdminAchievement, locale: string): string {
  return locale === "en" ? achievement.nameEn : achievement.nameFr;
}

export function AchievementsTable({
  achievements,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  isLoading,
  currentSort,
  currentSearch = "",
}: AchievementsTableProps) {
  const t = useTranslations("adminAchievements");
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

  const sortableColumns: { field: SortField; label: string }[] = [
    { field: "key", label: t("columns.key") },
    { field: "category", label: t("columns.category") },
    { field: "tier", label: t("columns.tier") },
    { field: "threshold", label: t("columns.threshold") },
    { field: "xp_value", label: t("columns.xpValue") },
    { field: "name", label: t("columns.name") },
  ];

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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("totalAchievements", { count: pagination.totalCount })}
      </p>

      {/* Loading state */}
      {isLoading ? (
        <AdminTableSkeleton columns={6} rows={8} />
      ) : achievements.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white/40 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-gray-500 dark:text-gray-400">{t("noAchievements")}</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  {sortableColumns.map((col) => (
                    <th key={col.field} scope="col" className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        onClick={() => handleSortClick(col.field)}
                        aria-label={t("sortBy", { field: col.label })}
                      >
                        {col.label}
                        {renderSortIcon(col.field)}
                      </button>
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {achievements.map((achievement) => (
                  <tr
                    key={achievement.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => onEdit(achievement.id)}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                      {achievement.key}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {t(`categories.${achievement.category}`)}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {t(`tiers.${achievement.tier}`)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {achievement.threshold}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {achievement.xpValue}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {getAchievementName(achievement, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(achievement.id)}
                          aria-label={t("editAchievement", {
                            name: getAchievementName(achievement, locale),
                          })}
                        >
                          <Icon icon="fa:edit" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(achievement)}
                          aria-label={t("deleteAchievement", {
                            name: getAchievementName(achievement, locale),
                          })}
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
                {t("page", {
                  current: pagination.currentPage,
                  total: pagination.totalPages,
                })}
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
