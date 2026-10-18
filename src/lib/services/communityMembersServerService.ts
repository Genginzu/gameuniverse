import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { CommunityMember, CommunityMemberRole } from "@/types/community";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/**
 * Server-side service for community membership: list, join, leave, role management.
 * Used by API routes under /api/communities/[slug]/join and member management.
 */
export class CommunityMembersServerService {
  /** List members of a community, sorted by join date (ascending). */
  static async fetchMembers(communityId: string): Promise<CommunityMember[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("community_members" as UntypedFrom)
      .select(
        `id, community_id, player_id, role, joined_at,
         player:profiles!community_members_player_id_fkey(id, username, avatar_url)`
      )
      .eq("community_id", communityId)
      .order("joined_at", { ascending: true });

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch community members", { error: error.message, communityId });
      throw new Error(error.message ?? "Failed to fetch community members");
    }

    return (
      (data ?? []) as unknown as Array<{
        id: string;
        community_id: string;
        player_id: string;
        role: CommunityMemberRole;
        joined_at: string;
        player: { id: string; username: string | null; avatar_url: string | null } | null;
      }>
    ).map((row) => ({
      id: row.id,
      communityId: row.community_id,
      playerId: row.player_id,
      role: row.role,
      joinedAt: row.joined_at,
      player: {
        id: row.player?.id ?? row.player_id,
        username: row.player?.username ?? null,
        avatarUrl: row.player?.avatar_url ?? null,
      },
    }));
  }

  /** Get a member's role in a community, or null if not a member. */
  static async getMemberRole(
    communityId: string,
    playerId: string
  ): Promise<CommunityMemberRole | null> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("community_members" as UntypedFrom)
      .select("role")
      .eq("community_id", communityId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (error || !data) return null;
    return (data as unknown as { role: CommunityMemberRole }).role;
  }

  /** Join a community as a regular member. */
  static async joinCommunity(communityId: string, playerId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase
      .from("community_members" as UntypedFrom)
      .insert({ community_id: communityId, player_id: playerId, role: "member" });

    if (error) {
      logger.error("Failed to join community", { error: error.message, communityId, playerId });
      throw new Error(error.message ?? "Failed to join community");
    }
  }

  /** Leave a community (also used to remove a member by owner/moderator). */
  static async leaveCommunity(communityId: string, playerId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase
      .from("community_members" as UntypedFrom)
      .delete()
      .eq("community_id", communityId)
      .eq("player_id", playerId);

    if (error) {
      logger.error("Failed to remove community member", {
        error: error.message,
        communityId,
        playerId,
      });
      throw new Error(error.message ?? "Failed to remove community member");
    }
  }

  /** Update a member's role. Caller must have verified owner/moderator role beforehand. */
  static async updateMemberRole(
    communityId: string,
    playerId: string,
    role: CommunityMemberRole
  ): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase
      .from("community_members" as UntypedFrom)
      .update({ role })
      .eq("community_id", communityId)
      .eq("player_id", playerId);

    if (error) {
      logger.error("Failed to update member role", {
        error: error.message,
        communityId,
        playerId,
      });
      throw new Error(error.message ?? "Failed to update member role");
    }
  }
}
