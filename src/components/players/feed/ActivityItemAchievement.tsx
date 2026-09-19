"use client";

import { Icon } from "@iconify/react";
import type { AchievementEventData } from "@/types/feed";

interface ActivityItemAchievementProps {
  data: AchievementEventData & {
    actor: { id: string; username: string; avatarUrl: string | null };
  };
}

export function ActivityItemAchievement({ data }: ActivityItemAchievementProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        icon={data.achievementIcon || "lucide:trophy"}
        className="h-5 w-5 text-yellow-500 dark:text-yellow-400"
      />
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
          {data.achievementName}
        </p>
        {data.achievementDescription && (
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {data.achievementDescription}
          </p>
        )}
      </div>
    </div>
  );
}
