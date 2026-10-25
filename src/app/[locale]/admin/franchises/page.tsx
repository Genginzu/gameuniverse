"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
import { Button } from "@/components/ui/button";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { useAdminResource } from "@/hooks/useAdminResource";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/navigation";
import { franchisesResource } from "@/lib/admin-resource/resources/franchises";
import type { AdminFranchiseListItem } from "@/types/admin-franchises";

const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);

export default function AdminFranchisesPage() {
  const t = useTranslations("admin.franchises");
  const router = useRouter();
  const franchises = useAdminResource(franchisesResource);
  const deletion = useAdminDeleteFlow(franchises, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  const columns: AdminColumnDef<AdminFranchiseListItem>[] = [
    {
      key: "name",
      labelKey: "columns.name",
      sortable: true,
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "slug",
      labelKey: "columns.slug",
      sortable: true,
      className: "px-4 py-3 font-mono text-sm text-gray-500 dark:text-gray-400",
    },
    {
      key: "igdbId",
      labelKey: "columns.source",
      render: (franchise) => (franchise.igdbId ? t("sourceIgdb") : t("sourceManual")),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "gameCount",
      labelKey: "columns.gameCount",
      render: (franchise) => t("gameCount", { count: franchise.gameCount }),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
  ];

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <Button className="min-h-11 w-full sm:w-auto" onClick={() => router.push("/admin/franchises/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newFranchise")}
          </Button>
        </div>

        <AdminDataTable<AdminFranchiseListItem>
          items={franchises.rows}
          columns={columns}
          pagination={franchises.pagination}
          onPageChange={franchises.setPage}
          onSearch={franchises.setSearch}
          onSort={(field, order) => franchises.setSort({ field, order })}
          onEdit={(franchise) => router.push(`/admin/franchises/${franchise.id}/edit`)}
          onDelete={deletion.request}
          isLoading={franchises.isLoading}
          currentSort={franchises.sort}
          currentSearch={franchises.search}
          translationNamespace="admin.franchises"
          totalCountKey="totalFranchises"
          emptyKey="noFranchises"
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.franchises.deleteDialog"
          warningParams={{ name: deletion.target?.name ?? "" }}
        />
      </section>
    </div>
  );
}
