/**
 * Types pour l'administration des succès (achievements).
 * Réutilise les types partagés de achievement.ts.
 */

import type { AchievementCategory, AchievementTier } from "./achievement";

/** Type pour la liste admin (inclut tous les champs non-localisés) */
export interface AdminAchievement {
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

/** Params pour le fetch paginé */
export interface FetchAchievementsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  locale?: string;
}

/** Résultat de recherche joueur */
export interface PlayerSearchResult {
  id: string;
  username: string;
  avatarUrl: string | null;
}
