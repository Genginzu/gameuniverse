"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAdminGenres } from "@/hooks/useAdminGenres";
import dynamic from "next/dynamic";
import type { AdminGenre } from "@/types/admin-genres";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminGenresPage() {
  const t = useTranslations("admin.genres");
  const locale = useLocale();
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
    (genre: AdminGenre) => {
      router.push(`/admin/genres/${genre.slug}/edit`);
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

  const genreColumns: AdminColumnDef<AdminGenre>[] = [
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
      key: "gameCount",
      labelKey: "columns.gameCount",
      render: (g) => t("gameCount", { count: g.gameCount }),
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
          <Button onClick={() => router.push("/admin/genres/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newGenre")}
          </Button>
        </div>

        <AdminDataTable<AdminGenre>
          items={genres}
          columns={genreColumns}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          isLoading={loading}
          currentSort={currentSort}
          currentSearch={currentSearch}
          translationNamespace="admin.genres"
          totalCountKey="totalGenres"
          emptyKey="noGenres"
        />

        <AdminDeleteDialog
          isOpen={genreToDelete !== null}
          translationNamespace="admin.genres.deleteDialog"
          warningParams={{ name: genreToDelete?.slug ?? "" }}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
