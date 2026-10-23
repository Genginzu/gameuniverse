"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { languagesResource } from "@/lib/admin-resource/resources/languages";
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
  const languages = useAdminResource(languagesResource);
  const deletion = useAdminDeleteFlow(languages, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

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
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <Button onClick={() => router.push("/admin/languages/new")}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newLanguage")}
          </Button>
        </div>

        <AdminDataTable<SupportedLanguage>
          items={languages.rows}
          columns={languageColumns}
          pagination={languages.pagination}
          onPageChange={languages.setPage}
          onSearch={languages.setSearch}
          onSort={(field, order) => languages.setSort({ field, order })}
          onEdit={(language) => router.push(`/admin/languages/${language.code}/edit`)}
          onDelete={deletion.request}
          isLoading={languages.isLoading}
          currentSort={languages.sort}
          currentSearch={languages.search}
          translationNamespace="admin.languages"
          idField="code"
          totalCountKey="totalLanguages"
          emptyKey="noLanguages"
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.languages.deleteDialog"
          warningParams={{ name: deletion.target?.name ?? "" }}
        />
      </section>

      <section>
        <SiteLocalesSection locales={SITE_LOCALES} />
      </section>
    </div>
  );
}
