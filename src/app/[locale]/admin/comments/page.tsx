"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { commentsResource } from "@/lib/admin-resource/resources/comments";
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
  const comments = useAdminResource(commentsResource);
  const deletion = useAdminDeleteFlow(comments, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const commentColumns: AdminColumnDef<AdminComment>[] = [
    {
      key: "player_name",
      labelKey: "columns.player",
      sortable: true,
      render: (c) => c.playerName ?? t("anonymousPlayer"),
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "character_name",
      labelKey: "columns.character",
      sortable: true,
      render: (c) => c.characterName,
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "content",
      labelKey: "columns.content",
      render: (c) => c.contentExcerpt,
      className: "max-w-xs truncate px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "created_at",
      labelKey: "columns.date",
      sortable: true,
      render: (c) => formatDate(c.createdAt),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
      </div>

      <AdminDataTable<AdminComment>
        items={comments.rows}
        columns={commentColumns}
        pagination={comments.pagination}
        onPageChange={comments.setPage}
        onSearch={comments.setSearch}
        onSort={(field, order) => comments.setSort({ field, order })}
        onEdit={(comment) => router.push(`/admin/comments/${comment.id}/edit`)}
        onDelete={deletion.request}
        isLoading={comments.isLoading}
        currentSort={comments.sort}
        currentSearch={comments.search}
        translationNamespace="admin.comments"
        totalCountKey="totalComments"
        emptyKey="noComments"
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.comments.deleteDialog"
        warningParams={{
          player: deletion.target?.playerName ?? "",
          character: deletion.target?.characterName ?? "",
        }}
      />
    </div>
  );
}
