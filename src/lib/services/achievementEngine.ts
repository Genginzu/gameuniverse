import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { computeLevel } from "@/lib/services/levelSystem";
import { achievementUnlocked } from "@/lib/services/notifications";
import { logger } from "@/lib/logger";
import type { AchievementCategory } from "@/types/achievement";

/**
 * Résultat d'une évaluation de succès pour un joueur.
 * Exporté pour être utilisé par les tests et les routes API.
 */
export interface EvaluationResult {
  newlyUnlocked: Array<{ key: string; xpAwarded: number }>;
  totalXpAwarded: number;
  newLevel: number | null; // null si pas de changement de niveau
}

const EMPTY_RESULT: EvaluationResult = {
  newlyUnlocked: [],
  totalXpAwarded: 0,
  newLevel: null,
};

/**
 * Moteur d'évaluation et d'attribution des succès.
 *
 * Évalue les succès d'une catégorie pour un joueur donné,
 * insère les succès débloqués, attribue l'XP et met à jour le niveau.
 * Toutes les erreurs sont loguées sans bloquer l'action principale.
 */
export class AchievementEngine {
  /**
   * Évalue les succès d'une catégorie pour un joueur.
   * Non-bloquant : les erreurs sont loguées, jamais propagées.
   */
  static async evaluate(userId: string, category: AchievementCategory): Promise<EvaluationResult> {
    try {
      // Service-role reads: the player evaluated is not always the session
      // user (both sides of a friendship), and RLS hides private stats.
      const supabase = getSupabaseAdmin();

      // 1. Récupérer le catalogue pour cette catégorie
      const { data: catalog, error: catalogError } = await supabase
        .from("achievement_catalog")
        .select("key, threshold, xp_value")
        .eq("category", category)
        .order("threshold", { ascending: true });

      if (catalogError) {
        logger.error("Failed to fetch achievement catalog", {
          error: catalogError,
          userId,
          category,
        });
        return EMPTY_RESULT;
      }

      if (!catalog || catalog.length === 0) return EMPTY_RESULT;

      // 2. Récupérer les succès déjà débloqués par ce joueur
      const { data: unlocked, error: unlockedError } = await supabase
        .from("player_achievements")
        .select("achievement_key")
        .eq("user_id", userId);

      if (unlockedError) {
        logger.error("Failed to fetch player achievements", {
          error: unlockedError,
          userId,
        });
        return EMPTY_RESULT;
      }

      const unlockedKeys = new Set((unlocked ?? []).map((row) => row.achievement_key));

      // 3. Récupérer le compteur actuel du joueur pour cette catégorie
      const playerCount = await AchievementEngine.getPlayerCount(userId, category);

      // 4. Identifier les succès à débloquer
      const toUnlock = catalog.filter(
        (entry) => !unlockedKeys.has(entry.key) && playerCount >= entry.threshold
      );

      if (toUnlock.length === 0) return EMPTY_RESULT;

      // 5. Insérer les nouveaux succès dans player_achievements.
      // Server-only write (migration 20261019000003).
      const newlyUnlocked: EvaluationResult["newlyUnlocked"] = [];

      for (const entry of toUnlock) {
        const { error: insertError } = await supabase
          .from("player_achievements")
          .insert({ user_id: userId, achievement_key: entry.key });

        if (insertError) {
          // Code 23505 = UNIQUE constraint violation (doublon)
          if (insertError.code === "23505") continue;
          logger.error("Failed to insert player achievement", {
            error: insertError,
            userId,
            key: entry.key,
          });
          continue;
        }

        newlyUnlocked.push({ key: entry.key, xpAwarded: entry.xp_value });
      }

      if (newlyUnlocked.length === 0) return EMPTY_RESULT;

      // 6. Calculer le total d'XP à ajouter
      const totalXpAwarded = newlyUnlocked.reduce((sum, a) => sum + a.xpAwarded, 0);

      // 7. Mettre à jour l'XP et le niveau
      const newLevel = await AchievementEngine.updateXpAndLevel(userId, totalXpAwarded);

      await Promise.all(
        newlyUnlocked.map((achievement) =>
          achievementUnlocked({ userId, achievementKey: achievement.key })
        )
      );

      return { newlyUnlocked, totalXpAwarded, newLevel };
    } catch (error) {
      logger.error("Achievement evaluation failed", { error, userId, category });
      return EMPTY_RESULT;
    }
  }

  /**
   * Récupère le compteur actuel d'un joueur pour une catégorie donnée.
   * - library : nombre de jeux dans user_library (hors liste de souhaits)
   * - playtime : total d'heures de jeu (game_sessions.duration_minutes / 60)
   * - reviews : nombre d'avis dans game_reviews
   * - social : nombre d'amis acceptés dans friendships
   * - collections : nombre de collections dans game_collections
   */
  static async getPlayerCount(userId: string, category: AchievementCategory): Promise<number> {
    try {
      const supabase = getSupabaseAdmin();

      switch (category) {
        case "library":
          return await countLibraryGames(supabase, userId);

        case "playtime":
          return await sumPlaytimeHours(supabase, userId);

        case "reviews":
          return await countRows(supabase, "game_reviews", userId);

        case "social":
          return await countFriends(supabase, userId);

        case "collections":
          return await countRows(supabase, "game_collections", userId);

        default:
          return 0;
      }
    } catch (error) {
      logger.error("Failed to get player count", { error, userId, category });
      return 0;
    }
  }

  /**
   * Upsert l'XP du joueur et met à jour le niveau du profil si nécessaire.
   * Retourne le nouveau niveau si changé, null sinon.
   *
   * XP et niveau sont des écritures server-only (issue #372) : on utilise le
   * client service-role (supabase-admin.ts) qui bypasse les RLS client-only.
   */
  private static async updateXpAndLevel(
    userId: string,
    xpToAdd: number
  ): Promise<number | null> {
    const supabase = getSupabaseAdmin();

    // Récupérer l'XP actuel (ou 0 si pas de ligne)
    const { data: xpRow } = await supabase
      .from("player_xp")
      .select("xp_total")
      .eq("user_id", userId)
      .single();

    const previousXp = xpRow?.xp_total ?? 0;
    const newXpTotal = previousXp + xpToAdd;

    // Upsert player_xp
    const { error: xpError } = await supabase.from("player_xp").upsert(
      {
        user_id: userId,
        xp_total: newXpTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (xpError) {
      logger.error("Failed to upsert player XP", { error: xpError, userId });
      return null;
    }

    // Calculer les niveaux avant/après
    const previousLevel = computeLevel(previousXp);
    const newLevel = computeLevel(newXpTotal);

    if (newLevel !== previousLevel) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ level: newLevel })
        .eq("id", userId);

      if (profileError) {
        logger.error("Failed to update profile level", {
          error: profileError,
          userId,
        });
      }

      return newLevel;
    }

    return null;
  }
}

// --- Fonctions utilitaires privées ---

type SupabaseClient = ReturnType<typeof getSupabaseAdmin>;

/** Compte les lignes d'une table filtrées par user_id. */
async function countRows(
  supabase: SupabaseClient,
  table: "game_reviews" | "game_collections",
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    logger.error(`Failed to count rows in ${table}`, { error, userId });
    return 0;
  }

  return count ?? 0;
}

/** Counts the games of a player's library; wished games are not owned yet. */
async function countLibraryGames(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .or("status.is.null,status.neq.wishlist");

  if (error) {
    logger.error("Failed to count rows in user_library", { error, userId });
    return 0;
  }

  return count ?? 0;
}

/** Somme les heures de jeu depuis game_sessions (duration_minutes → heures). */
async function sumPlaytimeHours(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("duration_minutes")
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to sum playtime hours", { error, userId });
    return 0;
  }

  if (!data || data.length === 0) return 0;

  const totalMinutes = data.reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0);

  // Convertir en heures entières (floor)
  return Math.floor(totalMinutes / 60);
}

/** Compte les amis acceptés (sender ou receiver) dans friendships. */
async function countFriends(supabase: SupabaseClient, userId: string): Promise<number> {
  // Compter les amitiés où le joueur est sender
  const { count: senderCount, error: senderError } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", userId)
    .eq("status", "accepted");

  if (senderError) {
    logger.error("Failed to count sender friendships", {
      error: senderError,
      userId,
    });
    return 0;
  }

  // Compter les amitiés où le joueur est receiver
  const { count: receiverCount, error: receiverError } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("status", "accepted");

  if (receiverError) {
    logger.error("Failed to count receiver friendships", {
      error: receiverError,
      userId,
    });
    return 0;
  }

  return (senderCount ?? 0) + (receiverCount ?? 0);
}
