"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTablePagination } from "@/components/admin/shared/AdminTablePagination";
import { getRatingColor } from "@/lib/utils/ratingColor";
import { cn } from "@/lib/utils";
import type { AdminReview } from "@/types/admin-reviews";
import type { PaginationInfo } from "@/types/pagination";
import { Icon } from "@iconify/react";

export interface AdminReviewsTableProps {
  reviews: AdminReview[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (review: AdminReview) => void;
  canDelete: boolean;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

type SortField = "created_at" | "rating" | "player_name" | "game_title";

export function AdminReviewsTable({ reviews, pagination, onPageChange, onSearch, onSort, onEdit, onDelete, canDelete, isLoading, currentSort, currentSearch = "" }: AdminReviewsTableProps) {
  const t = useTranslations("admin.reviews");

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
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };
  const playerName = (review: AdminReview) => review.playerName ?? t("anonymousPlayer");

  const sortHeaders: { field: SortField; label: string }[] = [
    { field: "player_name", label: t("columns.player") },
    { field: "game_title", label: t("columns.game") },
    { field: "rating", label: t("columns.rating") },
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
        {t("totalReviews", { count: pagination.totalCount })}
      </p>

      {isLoading ? (
        <AdminTableSkeleton columns={5} rows={8} />
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("noReviews")}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  {sortHeaders.map((h) => (
                    <th key={h.field} scope="col" className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        onClick={() => handleSortClick(h.field)}
                      >
                        {h.label}
                        {renderSortIcon(h.field)}
                      </button>
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.content")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("created_at")}
                    >
                      {t("columns.date")}
                      {renderSortIcon("created_at")}
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
                {reviews.map((review) => (
                  <tr key={review.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => onEdit(review.id)}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{playerName(review)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{review.gameTitle}</td>
                    <td className="px-4 py-3"><span className={cn("font-semibold", getRatingColor(review.rating, 20))}>{t("ratingOutOf", { rating: review.rating })}</span></td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500 dark:text-gray-400">{review.contentExcerpt}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(review.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(review.id)} aria-label={t("editReview", { player: playerName(review) })}><Icon icon="fa:edit" className="h-4 w-4" /></Button>
                        {canDelete && <Button variant="ghost" size="sm" onClick={() => onDelete(review)} aria-label={t("deleteReview", { player: playerName(review) })} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><Icon icon="fa:trash" className="h-4 w-4" /></Button>}
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
