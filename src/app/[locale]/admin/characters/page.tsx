"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { charactersResource } from "@/lib/admin-resource/resources/characters";
import dynamic from "next/dynamic";
import { AdminCharactersTable } from "@/components/admin/characters/AdminCharactersTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminCharactersPage() {
  const t = useTranslations("admin.characters");
  const router = useRouter();
  const { canDelete } = useAdminAuth();
  const characters = useAdminResource(charactersResource);
  const deletion = useAdminDeleteFlow(characters, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <Button onClick={() => router.push("/admin/characters/new")}>
          <Icon icon="fa:plus" className="h-4 w-4" />
          {t("newCharacter")}
        </Button>
      </div>

      <AdminCharactersTable
        characters={characters.rows}
        pagination={characters.pagination}
        onPageChange={characters.setPage}
        onSearch={characters.setSearch}
        onSort={(field, order) => characters.setSort({ field, order })}
        onEdit={(id) => router.push(`/admin/characters/${id}/edit`)}
        onDelete={deletion.request}
        canDelete={canDelete}
        isLoading={characters.isLoading}
        currentSort={characters.sort}
        currentSearch={characters.search}
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.characters.deleteDialog"
        warningParams={{ name: deletion.target?.name ?? "" }}
      />
    </div>
  );
}
