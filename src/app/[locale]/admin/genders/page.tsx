"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminGenders, type AdminGenderListItem } from "@/hooks/useAdminGenders";
import dynamic from "next/dynamic";
import { AdminGendersTable } from "@/components/admin/genders/AdminGendersTable";
const DeleteGenderDialog = dynamic(
  () => import("@/components/admin/genders/DeleteGenderDialog").then((m) => m.DeleteGenderDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminGendersPage() {
  const t = useTranslations("admin.genders");
  const router = useRouter();
  const { genders, pagination, loading, fetchGenders, deleteGender, checkGenderUsage } =
    useAdminGenders();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "slug",
    order: "asc",
  });
  const [genderToDelete, setGenderToDelete] = useState<AdminGenderListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchGenders({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchGenders, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchGenders({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchGenders, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchGenders({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchGenders, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/genders/${id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (gender: AdminGenderListItem) => {
      setGenderToDelete(gender);
      setUsageCount(undefined);
      try {
        const count = await checkGenderUsage(gender.id);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkGenderUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!genderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGender(genderToDelete.id);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setGenderToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [genderToDelete, deleteGender, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setGenderToDelete(null);
  }, [isDeleting]);

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

        <AdminGendersTable
          genders={genders}
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

        <DeleteGenderDialog
          gender={genderToDelete}
          isOpen={genderToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
