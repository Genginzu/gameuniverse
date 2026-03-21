"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";

import type { AdminPlatform } from "@/types/admin-platforms";
import type { PaginationInfo } from "@/types/pagination";
import { Icon } from "@iconify/react";

interface PlatformListProps {
  platforms: AdminPlatform[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (platform: AdminPlatform) => void;
  onDelete: (platform: AdminPlatform) => void;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

type SortField = "slug" | "name" | "game_count";

/** Resolve the platform name for the current locale, with fallback */
function getPlatformName(platform: AdminPlatform, locale: string): string {
  const translation = platform.translations.find((t) => t.language_code === locale);
  if (translation?.name) return translation.name;
  return platform.translations[0]?.name ?? platform.slug;
}

export function PlatformList({
  platforms,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  isLoading,
  currentSort,
  currentSearch = "",
}: PlatformListProps) {
  const t = useTranslations("admin.platforms");
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
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
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
        {t("totalPlatforms", { count: pagination.totalCount })}
      </p>

      {/* Loading state */}
      {isLoading ? (
        <AdminTableSkeleton columns={3} rows={6} />
      ) : platforms.length === 0 ? (
        <div className="rounded-xl border border-white/20 bg-white/40 p-12 text-center backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50">
          <p className="text-gray-500 dark:text-gray-400">{t("noPlatforms")}</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/20 dark:border-slate-700/50">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-white/20 bg-white/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50">
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
                    {t("columns.icon")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("game_count")}
                      aria-label={t("sortBy", { field: t("columns.gameCount") })}
                    >
                      {t("columns.gameCount")}
                      {renderSortIcon("game_count")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 bg-white/30 backdrop-blur-xl dark:divide-slate-700/50 dark:bg-slate-900/30">
                {platforms.map((platform) => {
                  const name = getPlatformName(platform, locale);
                  return (
                    <tr
                      key={platform.id}
                      className="cursor-pointer transition-all hover:bg-white/60 dark:hover:bg-slate-700/60"
                      onClick={() => onEdit(platform)}
                    >
                      <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                        {platform.slug}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {name}
                      </td>
                      <td className="px-4 py-3">
                        {platform.iconUrl ? (
                          <Image
                            src={platform.iconUrl}
                            alt={name}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded object-contain"
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {t("gameCount", { count: platform.gameCount })}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(platform)}
                            aria-label={t("editPlatform", { name })}
                          >
                            <Icon icon="fa:edit" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(platform)}
                            aria-label={t("deletePlatform", { name })}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Icon icon="fa:trash" className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  aria-label={t("previousPage")}
                >
                  <Icon icon="fa:chevron-left" className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
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
