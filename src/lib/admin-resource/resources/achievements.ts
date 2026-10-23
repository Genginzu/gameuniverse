import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminAchievement } from "@/types/admin-achievements";

export const achievementsResource = defineAdminResource<AdminAchievement>({
  path: "/api/admin/achievements",
  listKey: "achievements",
  keyOf: (achievement) => achievement.id,
  defaultSort: { field: "sort_order", order: "asc" },
  usage: true,
  forceDelete: true,
});
