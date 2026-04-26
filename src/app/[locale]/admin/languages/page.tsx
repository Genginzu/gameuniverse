"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminLanguages } from "@/hooks/useAdminLanguages";
import dynamic from "next/dynamic";
import type { SupportedLanguage } from "@/types/admin-languages";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import {
  SiteLocalesSection,
  type SiteLocale,
} from "@/components/admin/languages/SiteLocalesSection";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

const SITE_LOCALES: SiteLocale[] = [
  { code: "fr", name: "French", nativeName: "Français", isDefault: true, translationKeyCount: 670 },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    isDefault: false,
    translationKeyCount: 670,
  },
];

export default function AdminLanguagesPage() {
  const t = useTranslations("admin.languages");
  const router = useRouter();
  const { languages, pagination, loading, fetchLanguages, deleteLanguage, checkLanguageUsage } =
    useAdminLanguages();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "code",
    order: "asc",
  });
  const [languageToDelete, setLanguageToDelete] = useState<SupportedLanguage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchLanguages({ search: query, sortBy: currentSort.field, sortOrder: currentSort.order, page: 1 });
    },
    [fetchLanguages, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchLanguages({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchLanguages, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchLanguages({ search: currentSearch, sortBy: currentSort.field, sortOrder: currentSort.order, page });
    },
    [fetchLanguages, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (language: SupportedLanguage) => {
      router.push(`/admin/languages/${language.code}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (language: SupportedLanguage) => {
      setLanguageToDelete(language);
      setUsageCount(undefined);
      try {
        const count = await checkLanguageUsage(language.code);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkLanguageUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!languageToDelete) return;
    setIsDeleting(true);
    try {
      if (usageCount && usageCount > 0) {
        const response = await fetch(
          `/api/admin/languages/${encodeURIComponent(languageToDelete.code)}?force=true`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to delete language (${response.status})`);
        }
        await fetchLanguages({
          search: currentSearch,
          sortBy: currentSort.field,
          sortOrder: currentSort.order,
          page: pagination.currentPage,
        });
      } else {
        await deleteLanguage(languageToDelete.code);
      }
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setLanguageToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [languageToDelete, usageCount, deleteLanguage, fetchLanguages, currentSearch, currentSort, pagination.currentPage, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setLanguageToDelete(null);
  }, [isDeleting]);

  const languageColumns: AdminColumnDef<SupportedLanguage>[] = [
    {
      key: "code",
      labelKey: "columns.code",
      sortable: true,
      className: "px-4 py-3 font-mono text-sm text-gray-900 dark:text-white",
    },
    {
      key: "name",
      labelKey: "columns.name",
      sortable: true,
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "native_name",
      labelKey: "columns.nativeName",
      render: (l) => l.native_name || "—",
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
  ];

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <Button onClick={() => router.push("/admin/languages/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newLanguage")}
          </Button>
        </div>

        <AdminDataTable<SupportedLanguage>
          items={languages}
          columns={languageColumns}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          isLoading={loading}
          currentSort={currentSort}
          currentSearch={currentSearch}
          translationNamespace="admin.languages"
          idField="code"
          totalCountKey="totalLanguages"
          emptyKey="noLanguages"
        />

        <AdminDeleteDialog
          isOpen={languageToDelete !== null}
          translationNamespace="admin.languages.deleteDialog"
          warningParams={{ name: languageToDelete?.name ?? "" }}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>

      <section>
        <SiteLocalesSection locales={SITE_LOCALES} />
      </section>
    </div>
  );
}
