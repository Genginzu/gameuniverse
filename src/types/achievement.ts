/**
 * Types partagés pour le système de succès (achievements).
 * Utilisés par les services, API routes et composants UI.
 */

export type AchievementCategory = "library" | "playtime" | "reviews" | "social" | "collections";

export type AchievementTier = "bronze" | "silver" | "gold";

export interface AchievementCatalogEntry {
  id: string;
  key: string;
  category: AchievementCategory;
  tier: AchievementTier;
  threshold: number;
  xpValue: number;
  icon: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  sortOrder: number;
}

export interface PlayerAchievementWithDetails {
  key: string;
  category: AchievementCategory;
  tier: AchievementTier;
  threshold: number;
  xpValue: number;
  icon: string;
  /** Localisé selon la langue active */
  name: string;
  /** Localisé selon la langue active */
  description: string;
  unlockedAt: string | null;
  sortOrder: number;
}

export interface PlayerXpStats {
  xpTotal: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}
