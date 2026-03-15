import type { AchievementCategory, PlayerAchievementWithDetails } from "@/types/achievement";

const ALL_CATEGORIES: AchievementCategory[] = [
  "library",
  "playtime",
  "reviews",
  "social",
  "collections",
];

/** Groups achievements by category, preserving order within each group. */
export function groupByCategory(
  achievements: PlayerAchievementWithDetails[]
): Record<AchievementCategory, PlayerAchievementWithDetails[]> {
  const groups = Object.fromEntries(
    ALL_CATEGORIES.map((cat) => [cat, [] as PlayerAchievementWithDetails[]])
  ) as Record<AchievementCategory, PlayerAchievementWithDetails[]>;

  for (const a of achievements) {
    groups[a.category].push(a);
  }

  return groups;
}

/** Filters achievements by category. If category is null/undefined, returns all. */
export function filterByCategory(
  achievements: PlayerAchievementWithDetails[],
  category: AchievementCategory | null | undefined
): PlayerAchievementWithDetails[] {
  if (!category) return achievements;
  return achievements.filter((a) => a.category === category);
}
