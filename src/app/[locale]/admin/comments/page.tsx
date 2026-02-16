"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminComments } from "@/hooks/useAdminComments";
import type { AdminComment } from "@/types/admin-comments";
import { AdminCommentsTable } from "@/components/admin/comments/AdminCommentsTable";
import { DeleteCommentDialog } from "@/components/admin/comments/DeleteCommentDialog";
import { toast } from "@/hooks/use-toast";

export default function AdminCommentsPage() {
  const t = useTranslations("admin.comments");
  const router = useRouter();
  const { comments, pagination, loading, fetchComments, deleteComment } = useAdminComments();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "created_at",
    order: "desc",
  });
  const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchComments({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchComments, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchComments({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchComments, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchComments({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchComments, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/comments/${id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback((comment: AdminComment) => {
    setCommentToDelete(comment);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteComment(commentToDelete.id);
      toast({
        title: t("deleteDialog.success"),
        variant: "success",
      });
      setCommentToDelete(null);
    } catch {
      toast({
        title: t("deleteDialog.errorGeneric"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [commentToDelete, deleteComment, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setCommentToDelete(null);
    }
  }, [isDeleting]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
      </div>

      <AdminCommentsTable
        comments={comments}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        isLoading={loading}
        currentSort={currentSort}
        currentSearch={currentSearch}
      />

      <DeleteCommentDialog
        comment={commentToDelete}
        isOpen={commentToDelete !== null}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
