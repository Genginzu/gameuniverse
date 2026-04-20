"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminComments } from "@/hooks/useAdminComments";
import dynamic from "next/dynamic";
import type { AdminComment } from "@/types/admin-comments";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
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
      fetchComments({ search: query, sortBy: currentSort.field, sortOrder: currentSort.order, page: 1 });
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
      fetchComments({ search: currentSearch, sortBy: currentSort.field, sortOrder: currentSort.order, page });
    },
    [fetchComments, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (comment: AdminComment) => {
      router.push(`/admin/comments/${comment.id}/edit`);
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
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setCommentToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [commentToDelete, deleteComment, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setCommentToDelete(null);
  }, [isDeleting]);

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString(); } catch { return "—"; }
  };

  const commentColumns: AdminColumnDef<AdminComment>[] = [
    {
      key: "player_name", labelKey: "columns.player", sortable: true,
      render: (c) => c.playerName ?? t("anonymousPlayer"),
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    { key: "character_name", labelKey: "columns.character", sortable: true, render: (c) => c.characterName, className: "px-4 py-3 text-gray-500 dark:text-gray-400" },
    { key: "content", labelKey: "columns.content", render: (c) => c.contentExcerpt, className: "max-w-xs truncate px-4 py-3 text-gray-500 dark:text-gray-400" },
    { key: "created_at", labelKey: "columns.date", sortable: true, render: (c) => formatDate(c.createdAt), className: "px-4 py-3 text-gray-500 dark:text-gray-400" },
  ];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
      </div>

      <AdminDataTable<AdminComment>
        items={comments}
        columns={commentColumns}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        isLoading={loading}
        currentSort={currentSort}
        currentSearch={currentSearch}
        translationNamespace="admin.comments"
        totalCountKey="totalComments"
        emptyKey="noComments"
      />

      <AdminDeleteDialog
        isOpen={commentToDelete !== null}
        translationNamespace="admin.comments.deleteDialog"
        warningParams={{ player: commentToDelete?.playerName ?? "", character: commentToDelete?.characterName ?? "" }}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
