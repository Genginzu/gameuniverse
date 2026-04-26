"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PlayerAchievementManager } from "@/components/admin/achievements/PlayerAchievementManager";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export default function PlayerAchievementsPage() {
  const t = useTranslations("adminAchievements");
  const router = useRouter();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/achievements")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("playerManager.title")}
        </h1>

        <PlayerAchievementManager />
      </div>
    </div>
  );
}
