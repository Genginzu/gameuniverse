"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminReviews } from "@/hooks/useAdminReviews";
import type { AdminReview } from "@/types/admin-reviews";
import { AdminReviewsTable } from "@/components/admin/reviews/AdminReviewsTable";
import { DeleteReviewDialog } from "@/components/admin/reviews/DeleteReviewDialog";
import { toast } from "@/hooks/use-toast";

export default function AdminReviewsPage() {
  const t = useTranslations("admin.reviews");
  const router = useRouter();
  const { canDelete } = useAdminAuth();
  const { reviews, pagination, loading, fetchReviews, deleteReview } = useAdminReviews();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "created_at",
    order: "desc",
  });
  const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchReviews({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchReviews, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchReviews({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchReviews, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchReviews({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchReviews, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/reviews/${id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback((review: AdminReview) => {
    setReviewToDelete(review);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      await deleteReview(reviewToDelete.id);
      toast({
        title: t("deleteDialog.success"),
        variant: "success",
      });
      setReviewToDelete(null);
    } catch {
      toast({
        title: t("deleteDialog.errorGeneric"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [reviewToDelete, deleteReview, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setReviewToDelete(null);
    }
  }, [isDeleting]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
      </div>

      <AdminReviewsTable
        reviews={reviews}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        canDelete={canDelete}
        isLoading={loading}
        currentSort={currentSort}
        currentSearch={currentSearch}
      />

      <DeleteReviewDialog
        review={reviewToDelete}
        isOpen={reviewToDelete !== null}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
