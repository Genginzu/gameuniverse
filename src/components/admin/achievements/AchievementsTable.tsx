"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTablePagination } from "@/components/admin/shared/AdminTablePagination";
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

function getAchievementName(achievement: AdminAchievement, locale: string): string {
  return locale === "en" ? achievement.nameEn : achievement.nameFr;
}

export function AchievementsTable({ achievements, pagination, onPageChange, onSearch, onSort, onEdit, onDelete, isLoading, currentSort, currentSearch = "" }: AchievementsTableProps) {
  const t = useTranslations("adminAchievements");
  const locale = useLocale();

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
    { field: "key", label: t("columns.key") }, { field: "category", label: t("columns.category") },
    { field: "tier", label: t("columns.tier") }, { field: "threshold", label: t("columns.threshold") },
    { field: "xp_value", label: t("columns.xpValue") }, { field: "name", label: t("columns.name") },
  ];

  return (
    <div className="space-y-4">
      <AdminSearchBar
        currentSearch={currentSearch}
        onSearch={onSearch}
        placeholder={t("searchPlaceholder")}
        buttonLabel={t("search")}
      />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("totalAchievements", { count: pagination.totalCount })}
      </p>

      {isLoading ? (
        <AdminTableSkeleton columns={6} rows={8} />
      ) : achievements.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white/40 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-gray-500 dark:text-gray-400">{t("noAchievements")}</p>
        </div>
      ) : (
        <>
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
                      >
                        {col.label}
                        {renderSortIcon(col.field)}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {achievements.map((achievement) => (
                  <tr key={achievement.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => onEdit(achievement.id)}>
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">{achievement.key}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{t(`categories.${achievement.category}`)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{t(`tiers.${achievement.tier}`)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{achievement.threshold}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{achievement.xpValue}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{getAchievementName(achievement, locale)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(achievement.id)} aria-label={t("editAchievement", { name: getAchievementName(achievement, locale) })}><Icon icon="fa:edit" className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(achievement)} aria-label={t("deleteAchievement", { name: getAchievementName(achievement, locale) })} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><Icon icon="fa:trash" className="h-4 w-4" /></Button>
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
