"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminLanguages, type SupportedLanguage } from "@/hooks/useAdminLanguages";
import { AdminLanguagesTable } from "@/components/admin/languages/AdminLanguagesTable";
import { DeleteLanguageDialog } from "@/components/admin/languages/DeleteLanguageDialog";
import {
  SiteLocalesSection,
  type SiteLocale,
} from "@/components/admin/languages/SiteLocalesSection";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaPlus } from "react-icons/fa";

// Site locales data derived from src/i18n/routing.ts and src/messages/*.json
const SITE_LOCALES: SiteLocale[] = [
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    isDefault: true,
    translationKeyCount: 670,
  },
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
  const [currentSort, setCurrentSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({ field: "code", order: "asc" });

  const [languageToDelete, setLanguageToDelete] = useState<SupportedLanguage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchLanguages({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchLanguages, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchLanguages({
        search: currentSearch,
        sortBy: field,
        sortOrder: order,
        page: 1,
      });
    },
    [fetchLanguages, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchLanguages({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchLanguages, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (code: string) => {
      router.push(`/admin/languages/${code}/edit`);
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
        // If usage check fails, still show the dialog without usage info
        setUsageCount(undefined);
      }
    },
    [checkLanguageUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!languageToDelete) return;
    setIsDeleting(true);
    try {
      // If the language is in use, we need to force delete
      if (usageCount && usageCount > 0) {
        const response = await fetch(
          `/api/admin/languages/${encodeURIComponent(languageToDelete.code)}?force=true`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to delete language (${response.status})`);
        }
        // Refetch after force delete
        await fetchLanguages({
          search: currentSearch,
          sortBy: currentSort.field,
          sortOrder: currentSort.order,
          page: pagination.currentPage,
        });
      } else {
        await deleteLanguage(languageToDelete.code);
      }
      toast({
        title: t("deleteDialog.success"),
        variant: "success",
      });
      setLanguageToDelete(null);
    } catch {
      toast({
        title: t("deleteDialog.errorGeneric"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [
    languageToDelete,
    usageCount,
    deleteLanguage,
    fetchLanguages,
    currentSearch,
    currentSort,
    pagination.currentPage,
    t,
  ]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setLanguageToDelete(null);
    }
  }, [isDeleting]);

  return (
    <div className="space-y-8 p-4 lg:p-6">
      {/* Game Languages Section */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <Button onClick={() => router.push("/admin/languages/new")}>
            <FaPlus className="h-4 w-4" />
            {t("newLanguage")}
          </Button>
        </div>

        <AdminLanguagesTable
          languages={languages}
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

        <DeleteLanguageDialog
          language={languageToDelete}
          isOpen={languageToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>

      {/* Site Locales Section */}
      <section>
        <SiteLocalesSection locales={SITE_LOCALES} />
      </section>
    </div>
  );
}
