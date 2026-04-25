"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAdminSpecies, type AdminSpeciesListItem } from "@/hooks/useAdminSpecies";
import dynamic from "next/dynamic";
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
  const { species, pagination, loading, fetchSpecies, deleteSpecies, checkSpeciesUsage } =
    useAdminSpecies();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "slug",
    order: "asc",
  });
  const [speciesToDelete, setSpeciesToDelete] = useState<AdminSpeciesListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchSpecies({ search: query, sortBy: currentSort.field, sortOrder: currentSort.order, page: 1 });
    },
    [fetchSpecies, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchSpecies({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchSpecies, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchSpecies({ search: currentSearch, sortBy: currentSort.field, sortOrder: currentSort.order, page });
    },
    [fetchSpecies, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (sp: AdminSpeciesListItem) => {
      router.push(`/admin/species/${sp.slug}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (sp: AdminSpeciesListItem) => {
      setSpeciesToDelete(sp);
      setUsageCount(undefined);
      try {
        const count = await checkSpeciesUsage(sp.id);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkSpeciesUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!speciesToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSpecies(speciesToDelete.id);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setSpeciesToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [speciesToDelete, deleteSpecies, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setSpeciesToDelete(null);
  }, [isDeleting]);

  const speciesColumns: AdminColumnDef<AdminSpeciesListItem>[] = [
    { key: "slug", labelKey: "columns.slug", sortable: true, className: "px-4 py-3 font-mono text-sm text-gray-900 dark:text-white" },
    {
      key: "name", labelKey: "columns.name", sortable: true,
      render: (sp) => {
        const tr = sp.translations.find((t) => t.language_code === locale);
        return tr?.name ?? sp.translations[0]?.name ?? sp.slug;
      },
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    { key: "characterCount", labelKey: "columns.characterCount", render: (sp) => t("characterCount", { count: sp.characterCount }), className: "px-4 py-3 text-gray-500 dark:text-gray-400" },
  ];

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <Button onClick={() => router.push("/admin/species/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newSpecies")}
          </Button>
        </div>

        <AdminDataTable<AdminSpeciesListItem>
          items={species}
          columns={speciesColumns}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          isLoading={loading}
          currentSort={currentSort}
          currentSearch={currentSearch}
          translationNamespace="admin.species"
          totalCountKey="totalSpecies"
          emptyKey="noSpecies"
        />

        <AdminDeleteDialog
          isOpen={speciesToDelete !== null}
          translationNamespace="admin.species.deleteDialog"
          warningParams={{ name: speciesToDelete?.slug ?? "" }}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
