"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { reviewsResource } from "@/lib/admin-resource/resources/reviews";
import dynamic from "next/dynamic";
import { AdminReviewsTable } from "@/components/admin/reviews/AdminReviewsTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { toast } from "@/hooks/use-toast";

export default function AdminReviewsPage() {
  const t = useTranslations("admin.reviews");
  const router = useRouter();
  const { canDelete } = useAdminAuth();
  const reviews = useAdminResource(reviewsResource);
  const deletion = useAdminDeleteFlow(reviews, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
      </div>

      <AdminReviewsTable
        reviews={reviews.rows}
        pagination={reviews.pagination}
        onPageChange={reviews.setPage}
        onSearch={reviews.setSearch}
        onSort={(field, order) => reviews.setSort({ field, order })}
        onEdit={(id) => router.push(`/admin/reviews/${id}/edit`)}
        onDelete={deletion.request}
        canDelete={canDelete}
        isLoading={reviews.isLoading}
        currentSort={reviews.sort}
        currentSearch={reviews.search}
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.reviews.deleteDialog"
        warningParams={{
          player: deletion.target?.playerName ?? "",
          game: deletion.target?.gameTitle ?? "",
        }}
      />
    </div>
  );
}
