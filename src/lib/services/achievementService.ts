import { createRouteHandlerClient } from "@/lib/supabase-server";
import { computeLevelProgress } from "@/lib/services/levelSystem";
import { logger } from "@/lib/logger";
import type { PlayerAchievementWithDetails, PlayerXpStats } from "@/types/achievement";

/**
 * Service de lecture pour les succès et stats XP d'un joueur.
 * Utilisé par les API routes GET /api/players/[id]/achievements et /xp.
 */
export class AchievementService {
  /**
   * Récupère tous les succès du catalogue avec le statut débloqué/verrouillé
   * pour un joueur donné, localisés selon la locale.
   */
  static async fetchPlayerAchievements(
    playerId: string,
    locale: string
  ): Promise<PlayerAchievementWithDetails[]> {
    const supabase = await createRouteHandlerClient();

    // 1. Récupérer tout le catalogue, trié par catégorie puis sort_order
    const { data: catalog, error: catalogError } = await supabase
      .from("achievement_catalog")
      .select(
        "key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order"
      )
      .order("category")
      .order("sort_order");

    if (catalogError) {
      logger.error("Failed to fetch achievement catalog", { error: catalogError, playerId });
      return [];
    }

    if (!catalog || catalog.length === 0) return [];

    // 2. Récupérer les succès débloqués par ce joueur
    const { data: unlocked, error: unlockedError } = await supabase
      .from("player_achievements")
      .select("achievement_key, unlocked_at")
      .eq("user_id", playerId);

    if (unlockedError) {
      logger.error("Failed to fetch player achievements", { error: unlockedError, playerId });
      return [];
    }

    const unlockedMap = new Map(
      (unlocked ?? []).map((row) => [row.achievement_key, row.unlocked_at])
    );

    const isFr = locale === "fr";

    // 3. Mapper chaque entrée du catalogue avec le statut du joueur
    return catalog.map((entry) => ({
      key: entry.key,
      category: entry.category as PlayerAchievementWithDetails["category"],
      tier: entry.tier as PlayerAchievementWithDetails["tier"],
      threshold: entry.threshold,
      xpValue: entry.xp_value,
      icon: entry.icon,
      name: isFr ? entry.name_fr : entry.name_en,
      description: isFr ? entry.description_fr : entry.description_en,
      unlockedAt: unlockedMap.get(entry.key) ?? null,
      sortOrder: entry.sort_order,
    }));
  }

  /**
   * Récupère les stats XP/niveau d'un joueur.
   * Si le joueur n'a pas de ligne player_xp, retourne les stats pour 0 XP.
   */
  static async fetchPlayerXp(playerId: string): Promise<PlayerXpStats> {
    const supabase = await createRouteHandlerClient();

    const { data: xpRow, error: xpError } = await supabase
      .from("player_xp")
      .select("xp_total")
      .eq("user_id", playerId)
      .single();

    if (xpError && xpError.code !== "PGRST116") {
      // PGRST116 = no rows found — expected for players with no XP yet
      logger.error("Failed to fetch player XP", { error: xpError, playerId });
    }

    const xpTotal = xpRow?.xp_total ?? 0;
    return computeLevelProgress(xpTotal);
  }
}
