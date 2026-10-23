"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { genresResource } from "@/lib/admin-resource/resources/genres";
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
  const genres = useAdminResource(genresResource);
  const deletion = useAdminDeleteFlow(genres, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

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
          items={genres.rows}
          columns={genreColumns}
          pagination={genres.pagination}
          onPageChange={genres.setPage}
          onSearch={genres.setSearch}
          onSort={(field, order) => genres.setSort({ field, order })}
          onEdit={(genre) => router.push(`/admin/genres/${genre.slug}/edit`)}
          onDelete={deletion.request}
          isLoading={genres.isLoading}
          currentSort={genres.sort}
          currentSearch={genres.search}
          translationNamespace="admin.genres"
          totalCountKey="totalGenres"
          emptyKey="noGenres"
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.genres.deleteDialog"
          warningParams={{ name: deletion.target?.slug ?? "" }}
        />
      </section>
    </div>
  );
}
