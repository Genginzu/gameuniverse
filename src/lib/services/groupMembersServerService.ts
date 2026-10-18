import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { GroupMember, GroupMemberRole } from "@/types/group";

// Tables not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/**
 * Server-side service for group membership: list, join, leave, role management.
 * Used by API routes under /api/groups/[slug]/join and member management.
 */
export class GroupMembersServerService {
  /** List members of a group, sorted by join date (ascending). */
  static async fetchMembers(groupId: string): Promise<GroupMember[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("group_members" as UntypedFrom)
      .select(
        `id, group_id, player_id, role, joined_at,
         player:profiles!group_members_player_id_fkey(id, username, avatar_url)`
      )
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch group members", { error: error.message, groupId });
      throw new Error(error.message ?? "Failed to fetch group members");
    }

    return (
      (data ?? []) as unknown as Array<{
        id: string;
        group_id: string;
        player_id: string;
        role: GroupMemberRole;
        joined_at: string;
        player: { id: string; username: string | null; avatar_url: string | null } | null;
      }>
    ).map((row) => ({
      id: row.id,
      groupId: row.group_id,
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

  /** Get a member's role in a group, or null if not a member. */
  static async getMemberRole(groupId: string, playerId: string): Promise<GroupMemberRole | null> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("group_members" as UntypedFrom)
      .select("role")
      .eq("group_id", groupId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (error || !data) return null;
    return (data as unknown as { role: GroupMemberRole }).role;
  }

  /** Join a group as a regular member. */
  static async joinGroup(groupId: string, playerId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase
      .from("group_members" as UntypedFrom)
      .insert({ group_id: groupId, player_id: playerId, role: "member" });

    if (error) {
      logger.error("Failed to join group", { error: error.message, groupId, playerId });
      throw new Error(error.message ?? "Failed to join group");
    }
  }

  /** Leave a group (also used to remove a member by owner/admin). */
  static async leaveGroup(groupId: string, playerId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase
      .from("group_members" as UntypedFrom)
      .delete()
      .eq("group_id", groupId)
      .eq("player_id", playerId);

    if (error) {
      logger.error("Failed to remove group member", { error: error.message, groupId, playerId });
      throw new Error(error.message ?? "Failed to remove group member");
    }
  }

  /** Update a member's role. Caller must have verified owner/admin role beforehand. */
  static async updateMemberRole(
    groupId: string,
    playerId: string,
    role: GroupMemberRole
  ): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase
      .from("group_members" as UntypedFrom)
      .update({ role })
      .eq("group_id", groupId)
      .eq("player_id", playerId);

    if (error) {
      logger.error("Failed to update member role", { error: error.message, groupId, playerId });
      throw new Error(error.message ?? "Failed to update member role");
    }
  }
}
