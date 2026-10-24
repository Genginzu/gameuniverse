"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { speciesResource } from "@/lib/admin-resource/resources/species";
import type { AdminSpeciesListItem } from "@/types/admin-species";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminSpeciesPage() {
  const t = useTranslations("admin.species");
  const locale = useLocale();
  const router = useRouter();
  const species = useAdminResource(speciesResource);
  const deletion = useAdminDeleteFlow(species, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  const speciesColumns: AdminColumnDef<AdminSpeciesListItem>[] = [
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
      render: (sp) => {
        const tr = sp.translations.find((t) => t.language_code === locale);
        return tr?.name ?? sp.translations[0]?.name ?? sp.slug;
      },
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "characterCount",
      labelKey: "columns.characterCount",
      render: (sp) => t("characterCount", { count: sp.characterCount }),
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
          <Button onClick={() => router.push("/admin/species/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newSpecies")}
          </Button>
        </div>

        <AdminDataTable<AdminSpeciesListItem>
          items={species.rows}
          columns={speciesColumns}
          pagination={species.pagination}
          onPageChange={species.setPage}
          onSearch={species.setSearch}
          onSort={(field, order) => species.setSort({ field, order })}
          onEdit={(sp) => router.push(`/admin/species/${sp.slug}/edit`)}
          onDelete={deletion.request}
          isLoading={species.isLoading}
          currentSort={species.sort}
          currentSearch={species.search}
          translationNamespace="admin.species"
          totalCountKey="totalSpecies"
          emptyKey="noSpecies"
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.species.deleteDialog"
          warningParams={{ name: deletion.target?.slug ?? "" }}
        />
      </section>
    </div>
  );
}
