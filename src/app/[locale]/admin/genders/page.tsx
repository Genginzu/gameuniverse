"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { gendersResource } from "@/lib/admin-resource/resources/genders";
import type { AdminGenderListItem } from "@/types/admin-genders";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminGendersPage() {
  const t = useTranslations("admin.genders");
  const locale = useLocale();
  const router = useRouter();
  const genders = useAdminResource(gendersResource);
  const deletion = useAdminDeleteFlow(genders, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  const genderColumns: AdminColumnDef<AdminGenderListItem>[] = [
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
      render: (g) => {
        const tr = g.translations.find((t) => t.language_code === locale);
        return tr?.name ?? g.translations[0]?.name ?? g.slug;
      },
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "characterCount",
      labelKey: "columns.characterCount",
      render: (g) => t("characterCount", { count: g.characterCount }),
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
          <Button onClick={() => router.push("/admin/genders/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newGender")}
          </Button>
        </div>

        <AdminDataTable<AdminGenderListItem>
          items={genders.rows}
          columns={genderColumns}
          pagination={genders.pagination}
          onPageChange={genders.setPage}
          onSearch={genders.setSearch}
          onSort={(field, order) => genders.setSort({ field, order })}
          onEdit={(gender) => router.push(`/admin/genders/${gender.slug}/edit`)}
          onDelete={deletion.request}
          isLoading={genders.isLoading}
          currentSort={genders.sort}
          currentSearch={genders.search}
          translationNamespace="admin.genders"
          totalCountKey="totalGenders"
          emptyKey="noGenders"
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.genders.deleteDialog"
          warningParams={{ name: deletion.target?.slug ?? "" }}
        />
      </section>
    </div>
  );
}
