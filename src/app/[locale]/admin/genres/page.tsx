"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminGenres } from "@/hooks/useAdminGenres";
import dynamic from "next/dynamic";
import type { AdminGenre } from "@/types/admin-genres";
import { AdminGenresTable } from "@/components/admin/genres/AdminGenresTable";
const DeleteGenreDialog = dynamic(
  () => import("@/components/admin/genres/DeleteGenreDialog").then((m) => m.DeleteGenreDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminGenresPage() {
  const t = useTranslations("admin.genres");
  const router = useRouter();
  const { genres, pagination, loading, fetchGenres, deleteGenre, checkGenreUsage } =
    useAdminGenres();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({ field: "slug", order: "asc" });

  const [genreToDelete, setGenreToDelete] = useState<AdminGenre | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchGenres({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchGenres, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchGenres({
        search: currentSearch,
        sortBy: field,
        sortOrder: order,
        page: 1,
      });
    },
    [fetchGenres, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchGenres({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchGenres, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (slug: string) => {
      router.push(`/admin/genres/${slug}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (genre: AdminGenre) => {
      setGenreToDelete(genre);
      setUsageCount(undefined);
      try {
        const count = await checkGenreUsage(genre.slug);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkGenreUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!genreToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGenre(genreToDelete.slug);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setGenreToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [genreToDelete, deleteGenre, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setGenreToDelete(null);
    }
  }, [isDeleting]);

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <Button onClick={() => router.push("/admin/genres/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newGenre")}
          </Button>
        </div>

        <AdminGenresTable
          genres={genres}
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

        <DeleteGenreDialog
          genre={genreToDelete}
          isOpen={genreToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
