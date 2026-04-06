"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { useAdminRatingSystems } from "@/hooks/useAdminRatingSystems";
import { RatingSystemsTable } from "@/components/admin/age-classifications/RatingSystemsTable";
const DeleteRatingSystemDialog = dynamic(
  () =>
    import("@/components/admin/age-classifications/DeleteRatingSystemDialog").then(
      (m) => m.DeleteRatingSystemDialog
    ),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import type { AdminRatingSystem } from "@/types/admin-age-classifications";
import { Icon } from "@iconify/react";

export default function AdminAgeClassificationsPage() {
  const t = useTranslations("admin.ageClassifications");
  const router = useRouter();
  const {
    ratingSystems,
    pagination,
    loading,
    fetchRatingSystems,
    deleteRatingSystem,
    checkRatingSystemUsage,
  } = useAdminRatingSystems();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({ field: "code", order: "asc" });

  const [systemToDelete, setSystemToDelete] = useState<AdminRatingSystem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchRatingSystems({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchRatingSystems, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchRatingSystems({
        search: currentSearch,
        sortBy: field,
        sortOrder: order,
        page: 1,
      });
    },
    [fetchRatingSystems, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchRatingSystems({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchRatingSystems, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/age-classifications/${id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (system: AdminRatingSystem) => {
      setSystemToDelete(system);
      setUsageCount(undefined);
      try {
        const count = await checkRatingSystemUsage(system.id);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkRatingSystemUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!systemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRatingSystem(systemToDelete.id);
      toast({ title: t("toast.systemDeleted"), variant: "success" });
      setSystemToDelete(null);
    } catch {
      toast({ title: t("toast.deleteError"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [systemToDelete, deleteRatingSystem]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setSystemToDelete(null);
    }
  }, [isDeleting]);

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
          systems={ratingSystems}
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

        <DeleteRatingSystemDialog
          system={systemToDelete}
          isOpen={systemToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
