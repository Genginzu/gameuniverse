"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import type { AdminGenre } from "@/types/admin-genres";
import type { PaginationInfo } from "@/types/pagination";

export interface AdminGenresTableProps {
  genres: AdminGenre[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (slug: string) => void;
  onDelete: (genre: AdminGenre) => void;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

type SortField = "slug" | "name";

/** Resolve the genre name for the current locale, with fallback to first available translation */
function getGenreName(genre: AdminGenre, locale: string): string {
  const translation = genre.translations.find((t) => t.language_code === locale);
  if (translation?.name) return translation.name;
  return genre.translations[0]?.name ?? genre.slug;
}

export function AdminGenresTable({
  genres,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  isLoading,
  currentSort,
  currentSearch = "",
}: AdminGenresTableProps) {
  const t = useTranslations("admin.genres");
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
    if (currentSort?.field !== field) return <FaSort className="h-3 w-3 opacity-40" />;
    return currentSort.order === "asc" ? (
      <FaSortUp className="h-3 w-3" />
    ) : (
      <FaSortDown className="h-3 w-3" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
        {t("totalGenres", { count: pagination.totalCount })}
      </p>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : genres.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("noGenres")}</p>
        </div>
      ) : (
        <>
          {/* Table */}
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
                    {t("columns.gameCount")}
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
                {genres.map((genre) => (
                  <tr
                    key={genre.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => onEdit(genre.slug)}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                      {genre.slug}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {getGenreName(genre, locale)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t("gameCount", { count: genre.gameCount })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(genre.slug)}
                          aria-label={t("editGenre", { name: getGenreName(genre, locale) })}
                        >
                          <FaEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(genre)}
                          aria-label={t("deleteGenre", { name: getGenreName(genre, locale) })}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <FaTrash className="h-4 w-4" />
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
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  aria-label={t("previousPage")}
                >
                  <FaChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  aria-label={t("nextPage")}
                >
                  <FaChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
