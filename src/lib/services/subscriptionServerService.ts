import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { SubscriptionCounts, SubscriptionEntry } from "@/types/subscription";

/**
 * Service serveur pour les abonnements entre joueurs.
 * Table `player_subscriptions` (not yet in generated Supabase types, d'où `as any`).
 */
export class SubscriptionServerService {
  /**
   * Récupère la liste des joueurs que l'utilisateur suit (ses abonnements).
   */
  static async getSubscriptions(viewerId: string): Promise<SubscriptionEntry[]> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("player_subscriptions")
      .select(
        `
        id,
        created_at,
        target:profiles!target_id (id, username, avatar_url)
      `
      )
      .eq("subscriber_id", viewerId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        logger.warn("player_subscriptions table not found - migration not applied yet");
        return [];
      }
      throw error;
    }

    return mapRowsToEntries(data ?? [], "target");
  }

  /**
   * Récupère la liste des joueurs qui suivent la cible (ses abonnés).
   */
  static async getSubscribers(targetId: string): Promise<SubscriptionEntry[]> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("player_subscriptions")
      .select(
        `
        id,
        created_at,
        subscriber:profiles!subscriber_id (id, username, avatar_url)
      `
      )
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        logger.warn("player_subscriptions table not found - migration not applied yet");
        return [];
      }
      throw error;
    }

    return mapRowsToEntries(data ?? [], "subscriber");
  }

  /**
   * Crée un abonnement. Idempotent : un doublon (23505) est traité comme succès.
   */
  static async subscribe(subscriberId: string, targetId: string): Promise<void> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("player_subscriptions")
      .insert({ subscriber_id: subscriberId, target_id: targetId });

    if (error && error.code !== "23505") {
      throw error;
    }
  }

  /**
   * Supprime un abonnement (idempotent si la paire n'existe pas).
   */
  static async unsubscribe(subscriberId: string, targetId: string): Promise<void> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("player_subscriptions")
      .delete()
      .eq("subscriber_id", subscriberId)
      .eq("target_id", targetId);

    if (error) throw error;
  }

  /**
   * Retourne le nombre d'abonnés (followers) et d'abonnements (following) d'un joueur.
   * Les deux comptes sont récupérés en parallèle via des requêtes `head` (count only).
   */
  static async getCounts(playerId: string): Promise<SubscriptionCounts> {
    const supabase = await createServerClient();

    const [followersResult, followingResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("player_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("target_id", playerId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("player_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("subscriber_id", playerId),
    ]);

    const tableMissing = (code?: string) => code === "PGRST205" || code === "42P01";

    if (followersResult.error && !tableMissing(followersResult.error.code)) {
      throw followersResult.error;
    }
    if (followingResult.error && !tableMissing(followingResult.error.code)) {
      throw followingResult.error;
    }

    if (tableMissing(followersResult.error?.code) || tableMissing(followingResult.error?.code)) {
      logger.warn("player_subscriptions table not found - migration not applied yet");
      return { followers: 0, following: 0 };
    }

    return {
      followers: followersResult.count ?? 0,
      following: followingResult.count ?? 0,
    };
  }

  /**
   * Retourne si le spectateur est abonné à la cible.
   */
  static async getRelationship(
    viewerId: string,
    targetId: string
  ): Promise<{ isSubscribed: boolean }> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("player_subscriptions")
      .select("id")
      .eq("subscriber_id", viewerId)
      .eq("target_id", targetId)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return { isSubscribed: false };
      }
      throw error;
    }

    return { isSubscribed: !!data };
  }
}

type RawProfile = { id: string; username: string | null; avatar_url: string | null };
type RawRow = {
  id: string;
  created_at: string;
  target?: RawProfile | RawProfile[] | null;
  subscriber?: RawProfile | RawProfile[] | null;
};

function mapRowsToEntries(rows: RawRow[], key: "target" | "subscriber"): SubscriptionEntry[] {
  return rows
    .map((row) => {
      const raw = row[key];
      const profile = Array.isArray(raw) ? raw[0] : raw;
      if (!profile) return null;
      return {
        id: row.id,
        createdAt: row.created_at,
        profile: {
          id: profile.id,
          username: profile.username,
          avatarUrl: profile.avatar_url,
        },
      } satisfies SubscriptionEntry;
    })
    .filter((e): e is SubscriptionEntry => e !== null);
}
