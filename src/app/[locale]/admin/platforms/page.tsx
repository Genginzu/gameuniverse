"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAdminPlatforms } from "@/hooks/useAdminPlatforms";
import type { AdminPlatform } from "@/types/admin-platforms";
import { PlatformList } from "@/components/admin/platforms/PlatformList";
import { PlatformForm } from "@/components/admin/platforms/PlatformForm";
import { DeletePlatformDialog } from "@/components/admin/platforms/DeletePlatformDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaPlus } from "react-icons/fa";

export default function AdminPlatformsPage() {
  const t = useTranslations("admin.platforms");
  const locale = useLocale();
  const { platforms, pagination, loading, fetchPlatforms, deletePlatform, checkPlatformUsage } =
    useAdminPlatforms();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "slug",
    order: "asc",
  });

  // Form state: null = hidden, undefined = create, AdminPlatform = edit
  const [editingPlatform, setEditingPlatform] = useState<AdminPlatform | null | undefined>(null);
  const [platformToDelete, setPlatformToDelete] = useState<AdminPlatform | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchPlatforms({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
        locale,
      });
    },
    [fetchPlatforms, currentSort, locale]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchPlatforms({ search: currentSearch, sortBy: field, sortOrder: order, page: 1, locale });
    },
    [fetchPlatforms, currentSearch, locale]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchPlatforms({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
        locale,
      });
    },
    [fetchPlatforms, currentSearch, currentSort, locale]
  );

  const handleEdit = useCallback((platform: AdminPlatform) => {
    setEditingPlatform(platform);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingPlatform(undefined);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setEditingPlatform(null);
    fetchPlatforms({
      search: currentSearch,
      sortBy: currentSort.field,
      sortOrder: currentSort.order,
      page: pagination.currentPage,
      locale,
    });
  }, [fetchPlatforms, currentSearch, currentSort, pagination.currentPage, locale]);

  const handleFormCancel = useCallback(() => {
    setEditingPlatform(null);
  }, []);

  const handleDeleteRequest = useCallback(
    async (platform: AdminPlatform) => {
      setPlatformToDelete(platform);
      setUsageCount(undefined);
      try {
        const count = await checkPlatformUsage(platform.slug);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkPlatformUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!platformToDelete) return;
    setIsDeleting(true);
    try {
      await deletePlatform(platformToDelete.slug);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setPlatformToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [platformToDelete, deletePlatform, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setPlatformToDelete(null);
    }
  }, [isDeleting]);

  const showForm = editingPlatform !== null;

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <Button onClick={handleCreate}>
            <FaPlus className="h-4 w-4" />
            {t("newPlatform")}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6">
            <PlatformForm
              platform={editingPlatform ?? null}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        <PlatformList
          platforms={platforms}
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

        <DeletePlatformDialog
          platform={platformToDelete}
          isOpen={platformToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
