"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { gamesResource } from "@/lib/admin-resource/resources/games";
import dynamic from "next/dynamic";
import { AdminGamesTable } from "@/components/admin/games/AdminGamesTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminGamesPage() {
  const t = useTranslations("admin.games");
  const router = useRouter();
  const { canDelete } = useAdminAuth();
  const games = useAdminResource(gamesResource);
  const deletion = useAdminDeleteFlow(games, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <Button onClick={() => router.push("/admin/games/new")}>
          <Icon icon="fa:plus" className="h-4 w-4" />
          {t("newGame")}
        </Button>
      </div>

      <AdminGamesTable
        games={games.rows}
        pagination={games.pagination}
        onPageChange={games.setPage}
        onSearch={games.setSearch}
        onSort={(field, order) => games.setSort({ field, order })}
        onEdit={(id) => router.push(`/admin/games/${id}/edit`)}
        onDelete={deletion.request}
        canDelete={canDelete}
        isLoading={games.isLoading}
        currentSort={games.sort}
        currentSearch={games.search}
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.games.deleteDialog"
        warningParams={{ title: deletion.target?.title ?? "" }}
      />
    </div>
  );
}
