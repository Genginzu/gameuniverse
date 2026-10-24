"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { companiesResource } from "@/lib/admin-resource/resources/companies";
import type { AdminCompany } from "@/types/admin-companies";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

function companyTypeKey(type: string): string {
  switch (type) {
    case "developer":
      return "typeDeveloper";
    case "publisher":
      return "typePublisher";
    case "both":
      return "typeBoth";
    default:
      return "typeBoth";
  }
}

export default function AdminCompaniesPage() {
  const t = useTranslations("admin.companies");
  const router = useRouter();
  const companies = useAdminResource(companiesResource);
  const deletion = useAdminDeleteFlow(companies, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  const companyColumns: AdminColumnDef<AdminCompany>[] = [
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
      className: "px-4 py-3 font-mono text-sm text-gray-900 dark:text-white",
    },
    {
      key: "company_type",
      labelKey: "columns.type",
      render: (c) => t(companyTypeKey(c.company_type)),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "gameCount",
      labelKey: "columns.gameCount",
      render: (c) => t("gameCount", { count: c.gameCount }),
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
          <Button onClick={() => router.push("/admin/companies/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newCompany")}
          </Button>
        </div>

        <AdminDataTable<AdminCompany>
          items={companies.rows}
          columns={companyColumns}
          pagination={companies.pagination}
          onPageChange={companies.setPage}
          onSearch={companies.setSearch}
          onSort={(field, order) => companies.setSort({ field, order })}
          onEdit={(company) => router.push(`/admin/companies/${company.slug}/edit`)}
          onDelete={deletion.request}
          isLoading={companies.isLoading}
          currentSort={companies.sort}
          currentSearch={companies.search}
          translationNamespace="admin.companies"
          totalCountKey="totalCompanies"
          emptyKey="noCompanies"
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.companies.deleteDialog"
          warningParams={{ name: deletion.target?.name ?? "" }}
        />
      </section>
    </div>
  );
}
