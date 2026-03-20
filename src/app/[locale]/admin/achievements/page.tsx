"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminAchievements } from "@/hooks/useAdminAchievements";
import type { AdminAchievement } from "@/types/admin-achievements";
import { AchievementsTable } from "@/components/admin/achievements/AchievementsTable";
import { DeleteAchievementDialog } from "@/components/admin/achievements/DeleteAchievementDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";


export default function AdminAchievementsPage() {
  const t = useTranslations("adminAchievements");
  const router = useRouter();
  const { achievements, pagination, loading, fetchAchievements, deleteAchievement, checkUsage } =
    useAdminAchievements();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({ field: "sort_order", order: "asc" });

  const [achievementToDelete, setAchievementToDelete] = useState<AdminAchievement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchAchievements({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchAchievements, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchAchievements({
        search: currentSearch,
        sortBy: field,
        sortOrder: order,
        page: 1,
      });
    },
    [fetchAchievements, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchAchievements({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchAchievements, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/achievements/${id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    async (achievement: AdminAchievement) => {
      setAchievementToDelete(achievement);
      setUsageCount(undefined);
      try {
        const count = await checkUsage(achievement.id);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!achievementToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAchievement(achievementToDelete.id);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setAchievementToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [achievementToDelete, deleteAchievement, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setAchievementToDelete(null);
    }
  }, [isDeleting]);

  return (
    <div className="space-y-8 p-4 lg:p-6">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/achievements/players")}>
              <Icon icon="fa:user-friends" className="h-4 w-4"  />
              {t("playerManager.title")}
            </Button>
            <Button onClick={() => router.push("/admin/achievements/new")}>
              <Icon icon="fa:plus" className="h-4 w-4"  />
              {t("newAchievement")}
            </Button>
          </div>
        </div>

        <AchievementsTable
          achievements={achievements}
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

        <DeleteAchievementDialog
          achievement={achievementToDelete}
          isOpen={achievementToDelete !== null}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          usageCount={usageCount}
        />
      </section>
    </div>
  );
}
