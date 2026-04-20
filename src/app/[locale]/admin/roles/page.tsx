"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAdminRoles } from "@/hooks/useAdminRoles";
import dynamic from "next/dynamic";
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
  const { roles, pagination, loading, fetchRoles, deleteRole, checkRoleUsage } = useAdminRoles();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "slug",
    order: "asc",
  });
  const [roleToDelete, setRoleToDelete] = useState<AdminRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchRoles({ search: query, sortBy: currentSort.field, sortOrder: currentSort.order, page: 1 });
    },
    [fetchRoles, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchRoles({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchRoles, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchRoles({ search: currentSearch, sortBy: currentSort.field, sortOrder: currentSort.order, page });
    },
    [fetchRoles, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (role: AdminRole) => {
      router.push(`/admin/roles/${role.slug}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (role: AdminRole) => {
      setRoleToDelete(role);
      setUsageCount(undefined);
      try {
        const count = await checkRoleUsage(role.slug);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkRoleUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRole(roleToDelete.slug);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setRoleToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [roleToDelete, deleteRole, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setRoleToDelete(null);
  }, [isDeleting]);

  const roleColumns: AdminColumnDef<AdminRole>[] = [
    { key: "slug", labelKey: "columns.slug", sortable: true, className: "px-4 py-3 font-mono text-sm text-gray-900 dark:text-white" },
    {
      key: "name", labelKey: "columns.name", sortable: true,
      render: (r) => {
        const tr = r.translations.find((t) => t.language_code === locale);
        return tr?.name ?? r.translations[0]?.name ?? r.slug;
      },
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    { key: "characterCount", labelKey: "columns.characterCount", render: (r) => t("characterCount", { count: r.characterCount }), className: "px-4 py-3 text-gray-500 dark:text-gray-400" },
  ];

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <Button onClick={() => router.push("/admin/roles/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newRole")}
          </Button>
        </div>

        <AdminDataTable<AdminRole>
          items={roles}
          columns={roleColumns}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          isLoading={loading}
          currentSort={currentSort}
          currentSearch={currentSearch}
          translationNamespace="admin.characterRoles"
          totalCountKey="totalRoles"
          emptyKey="noRoles"
        />

        <AdminDeleteDialog
          isOpen={roleToDelete !== null}
          translationNamespace="admin.roles.deleteDialog"
          warningParams={{ name: roleToDelete?.slug ?? "" }}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
