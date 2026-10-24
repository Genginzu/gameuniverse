"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { platformsResource } from "@/lib/admin-resource/resources/platforms";
import type { AdminPlatform } from "@/types/admin-platforms";
import { PlatformList } from "@/components/admin/platforms/PlatformList";
import { PlatformForm } from "@/components/admin/platforms/PlatformForm";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

function getPlatformName(platform: AdminPlatform, locale: string): string {
  const translation = platform.translations.find((t) => t.language_code === locale);
  if (translation?.name) return translation.name;
  return platform.translations[0]?.name ?? platform.slug;
}

export default function AdminPlatformsPage() {
  const t = useTranslations("admin.platforms");
  const locale = useLocale();
  const platforms = useAdminResource(platformsResource);
  const deletion = useAdminDeleteFlow(platforms, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  const [editingPlatform, setEditingPlatform] = useState<AdminPlatform | null | undefined>(null);

  const handleFormSuccess = () => {
    setEditingPlatform(null);
    platforms.revalidate();
  };

  const showForm = editingPlatform !== null;

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <Button onClick={() => setEditingPlatform(undefined)}>
            <Icon icon="fa:plus" className="h-4 w-4" />
            {t("newPlatform")}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6">
            <PlatformForm
              platform={editingPlatform ?? null}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditingPlatform(null)}
            />
          </div>
        )}

        <PlatformList
          platforms={platforms.rows}
          pagination={platforms.pagination}
          onPageChange={platforms.setPage}
          onSearch={platforms.setSearch}
          onSort={(field, order) => platforms.setSort({ field, order })}
          onEdit={setEditingPlatform}
          onDelete={deletion.request}
          isLoading={platforms.isLoading}
          currentSort={platforms.sort}
          currentSearch={platforms.search}
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="admin.platforms.deleteDialog"
          warningParams={{
            name: deletion.target ? getPlatformName(deletion.target, locale) : "",
          }}
        />
      </section>
    </div>
  );
}
