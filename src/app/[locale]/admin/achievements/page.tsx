"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { achievementsResource } from "@/lib/admin-resource/resources/achievements";
import { AchievementsTable } from "@/components/admin/achievements/AchievementsTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminAchievementsPage() {
  const t = useTranslations("adminAchievements");
  const router = useRouter();
  const achievements = useAdminResource(achievementsResource);
  const deletion = useAdminDeleteFlow(achievements, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/achievements/players")}>
              <Icon icon="lucide:award" className="h-4 w-4" />
              {t("playerManager.title")}
            </Button>
            <Button onClick={() => router.push("/admin/achievements/new")}>
              <Icon icon="fa:plus" className="h-4 w-4" />
              {t("newAchievement")}
            </Button>
          </div>
        </div>

        <AchievementsTable
          achievements={achievements.rows}
          pagination={achievements.pagination}
          onPageChange={achievements.setPage}
          onSearch={achievements.setSearch}
          onSort={(field, order) => achievements.setSort({ field, order })}
          onEdit={(id) => router.push(`/admin/achievements/${id}/edit`)}
          onDelete={deletion.request}
          isLoading={achievements.isLoading}
          currentSort={achievements.sort}
          currentSearch={achievements.search}
        />

        <AdminDeleteDialog
          {...deletion.dialog}
          translationNamespace="adminAchievements.deleteDialog"
          warningParams={{ name: deletion.target?.key ?? "" }}
          forceConfirmKey="forceConfirm"
          forceWarningKey="forceWarning"
        />
      </section>
    </div>
  );
}
