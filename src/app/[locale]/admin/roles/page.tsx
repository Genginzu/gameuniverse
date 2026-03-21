"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminRoles } from "@/hooks/useAdminRoles";
import type { AdminRole } from "@/types/admin-roles";
import { AdminRolesTable } from "@/components/admin/roles/AdminRolesTable";
import { DeleteRoleDialog } from "@/components/admin/roles/DeleteRoleDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminRolesPage() {
  const t = useTranslations("admin.characterRoles");
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
      fetchRoles({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
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
      fetchRoles({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchRoles, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (slug: string) => router.push(`/admin/roles/${slug}/edit`),
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

        <AdminRolesTable
          roles={roles}
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

        <DeleteRoleDialog
          role={roleToDelete}
          isOpen={roleToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
