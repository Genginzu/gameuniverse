"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { rolesResource } from "@/lib/admin-resource/resources/roles";
import type { AdminRole } from "@/types/admin-roles";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminRolesPage() {
  const t = useTranslations("admin.characterRoles");
  const locale = useLocale();
  const router = useRouter();
  const roles = useAdminResource(rolesResource);
  const deletion = useAdminDeleteFlow(roles, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  const roleColumns: AdminColumnDef<AdminRole>[] = [
    {
      key: "slug",
      labelKey: "columns.slug",
      sortable: true,
      className: "px-4 py-3 font-mono text-sm text-gray-900 dark:text-white",
    },
    {
      key: "name",
      labelKey: "columns.name",
      sortable: true,
      render: (r) => {
        const tr = r.translations.find((t) => t.language_code === locale);
        return tr?.name ?? r.translations[0]?.name ?? r.slug;
      },
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "characterCount",
      labelKey: "columns.characterCount",
      render: (r) => t("characterCount", { count: r.characterCount }),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
  ];

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <Button onClick={() => router.push("/admin/roles/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newRole")}
          </Button>
        </div>

        <AdminDataTable<AdminRole>
          items={roles.rows}
          columns={roleColumns}
          pagination={roles.pagination}
          onPageChange={roles.setPage}
          onSearch={roles.setSearch}
          onSort={(field, order) => roles.setSort({ field, order })}
          onEdit={(role) => router.push(`/admin/roles/${role.slug}/edit`)}
          onDelete={deletion.request}
          isLoading={roles.isLoading}
          currentSort={roles.sort}
          currentSearch={roles.search}
          translationNamespace="admin.characterRoles"
          totalCountKey="totalRoles"
          emptyKey="noRoles"
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.roles.deleteDialog"
          warningParams={{ name: deletion.target?.slug ?? "" }}
        />
      </section>
    </div>
  );
}
