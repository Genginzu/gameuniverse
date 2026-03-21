"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminCompanies } from "@/hooks/useAdminCompanies";
import dynamic from "next/dynamic";
import type { AdminCompany } from "@/types/admin-companies";
import { AdminCompaniesTable } from "@/components/admin/companies/AdminCompaniesTable";
const DeleteCompanyDialog = dynamic(
  () =>
    import("@/components/admin/companies/DeleteCompanyDialog").then((m) => m.DeleteCompanyDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminCompaniesPage() {
  const t = useTranslations("admin.companies");
  const router = useRouter();
  const { companies, pagination, loading, fetchCompanies, deleteCompany, checkCompanyUsage } =
    useAdminCompanies();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({ field: "name", order: "asc" });

  const [companyToDelete, setCompanyToDelete] = useState<AdminCompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchCompanies({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchCompanies, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchCompanies({
        search: currentSearch,
        sortBy: field,
        sortOrder: order,
        page: 1,
      });
    },
    [fetchCompanies, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchCompanies({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchCompanies, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (slug: string) => {
      router.push(`/admin/companies/${slug}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (company: AdminCompany) => {
      setCompanyToDelete(company);
      setUsageCount(undefined);
      try {
        const count = await checkCompanyUsage(company.slug);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkCompanyUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCompany(companyToDelete.slug);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setCompanyToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [companyToDelete, deleteCompany, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setCompanyToDelete(null);
    }
  }, [isDeleting]);

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

        <AdminCompaniesTable
          companies={companies}
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

        <DeleteCompanyDialog
          company={companyToDelete}
          isOpen={companyToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
