"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { ratingSystemsResource } from "@/lib/admin-resource/resources/ratingSystems";
import { RatingSystemsTable } from "@/components/admin/age-classifications/RatingSystemsTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminAgeClassificationsPage() {
  const t = useTranslations("admin.ageClassifications");
  const router = useRouter();
  const ratingSystems = useAdminResource(ratingSystemsResource);
  const deletion = useAdminDeleteFlow(ratingSystems, {
    onDeleted: () => toast({ title: t("toast.systemDeleted"), variant: "success" }),
    onError: () => toast({ title: t("toast.deleteError"), variant: "destructive" }),
  });

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <Button onClick={() => router.push("/admin/age-classifications/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newSystem")}
          </Button>
        </div>

        <RatingSystemsTable
          systems={ratingSystems.rows}
          pagination={ratingSystems.pagination}
          onPageChange={ratingSystems.setPage}
          onSearch={ratingSystems.setSearch}
          onSort={(field, order) => ratingSystems.setSort({ field, order })}
          onEdit={(id) => router.push(`/admin/age-classifications/${id}/edit`)}
          onDelete={deletion.request}
          isLoading={ratingSystems.isLoading}
          currentSort={ratingSystems.sort}
          currentSearch={ratingSystems.search}
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.ageClassifications.deleteSystem"
          warningParams={{ name: deletion.target?.name ?? "" }}
          warningKey="confirm"
          confirmKey="delete"
          blockOnUsage
        />
      </section>
    </div>
  );
}
