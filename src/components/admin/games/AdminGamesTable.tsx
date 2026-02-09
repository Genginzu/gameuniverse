"use client";

import { useTranslations } from "next-intl";
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
  FaImage,
} from "react-icons/fa";
import type { AdminGame, PaginationInfo } from "@/hooks/useAdminGames";

export interface AdminGamesTableProps {
  games: AdminGame[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (game: AdminGame) => void;
  canDelete: boolean;
  isLoading: boolean;
  currentSort?: { field: string; order: "asc" | "desc" };
  currentSearch?: string;
}

type SortField = "title" | "release_date" | "updated_at";
export function AdminGamesTable({
  games,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  canDelete,
  isLoading,
  currentSort,
  currentSearch = "",
}: AdminGamesTableProps) {
  const t = useTranslations("admin.games");
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
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
        {t("totalGames", { count: pagination.totalCount })}
      </p>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("noGames")}</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.image")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("title")}
                      aria-label={t("sortBy", { field: t("columns.title") })}
                    >
                      {t("columns.title")}
                      {renderSortIcon("title")}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("release_date")}
                      aria-label={t("sortBy", { field: t("columns.releaseDate") })}
                    >
                      {t("columns.releaseDate")}
                      {renderSortIcon("release_date")}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("updated_at")}
                      aria-label={t("sortBy", { field: t("columns.updatedAt") })}
                    >
                      {t("columns.updatedAt")}
                      {renderSortIcon("updated_at")}
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
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => onEdit(game.id)}
                  >
                    <td className="px-4 py-3">
                      {game.coverImage ? (
                        <img
                          src={game.coverImage}
                          alt={game.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                          <FaImage className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {game.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(game.releaseDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(game.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(game.id)}
                          aria-label={t("editGame", { title: game.title })}
                        >
                          <FaEdit className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(game)}
                            aria-label={t("deleteGame", { title: game.title })}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FaTrash className="h-4 w-4" />
                          </Button>
                        )}
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
