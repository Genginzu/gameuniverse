import type { AchievementCategory, PlayerAchievementWithDetails } from "@/types/achievement";

/** Filters achievements by category. If category is null/undefined, returns all. */
export function filterByCategory(
  achievements: PlayerAchievementWithDetails[],
  category: AchievementCategory | null | undefined
): PlayerAchievementWithDetails[] {
  if (!category) return achievements;
  return achievements.filter((a) => a.category === category);
}
