import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type {
  FriendSummary,
  FriendRequest,
  FriendsListResponse,
  RelationshipStatusResponse,
} from "@/types/friendship";

const DEFAULT_PAGE_SIZE = 20;

/** Profile fields needed for friend display */
interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

/**
 * Server-side service for friendship operations.
 * Each method creates its own Supabase route-handler client
 * so it can be used in API routes with full cookie access.
 */
export class FriendServerService {
  /** List accepted friends for a player with pagination. */
  static async getFriends(
    playerId: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE
  ): Promise<FriendsListResponse> {
    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // Count total accepted friendships (both directions)
    const totalCount = await this.getFriendCount(playerId);
    const totalPages = Math.ceil(totalCount / limit);

    // Query friendships where player is sender → friend is receiver
    const { data: asSender, error: senderErr } = await supabase
      .from("friendships")
      .select("id, receiver_id, updated_at")
      .eq("sender_id", playerId)
      .eq("status", "accepted");

    if (senderErr) {
      logger.error("Failed to fetch friendships as sender", { error: senderErr.message, playerId });
      throw new Error(senderErr.message ?? "Failed to fetch friendships as sender");
    }

    // Query friendships where player is receiver → friend is sender
    const { data: asReceiver, error: receiverErr } = await supabase
      .from("friendships")
      .select("id, sender_id, updated_at")
      .eq("receiver_id", playerId)
      .eq("status", "accepted");

    if (receiverErr) {
      logger.error("Failed to fetch friendships as receiver", {
        error: receiverErr.message,
        playerId,
      });
      throw new Error(receiverErr.message ?? "Failed to fetch friendships as receiver");
    }

    // Merge both directions into a unified list with the friend's profile ID
    const merged = [
      ...(asSender ?? []).map((r) => ({
        friendshipId: r.id,
        friendProfileId: r.receiver_id,
        updatedAt: r.updated_at,
      })),
      ...(asReceiver ?? []).map((r) => ({
        friendshipId: r.id,
        friendProfileId: r.sender_id,
        updatedAt: r.updated_at,
      })),
    ];

    // Sort by updated_at descending then paginate in memory
    merged.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
    const pageSlice = merged.slice(offset, offset + limit);

    if (pageSlice.length === 0) {
      return {
        friends: [],
        totalCount,
        pagination: { currentPage: page, totalPages, hasNextPage: page < totalPages },
      };
    }

    // Fetch profiles for the friends on this page
    const profileIds = pageSlice.map((f) => f.friendProfileId);
    const profileMap = await this.fetchProfileMap(profileIds);

    const friends: FriendSummary[] = pageSlice.map((f) => {
      const profile = profileMap.get(f.friendProfileId);
      return {
        id: f.friendProfileId,
        friendshipId: f.friendshipId,
        displayName: profile?.username ?? "Unknown",
        avatarUrl: profile?.avatar_url ?? null,
        level: 0, // profiles table has no level column — can be enhanced later
        acceptedAt: f.updatedAt ?? new Date().toISOString(),
      };
    });

    return {
      friends,
      totalCount,
      pagination: { currentPage: page, totalPages, hasNextPage: page < totalPages },
    };
  }

  /** Get pending friend requests received by a player. */
  static async getPendingRequests(receiverId: string): Promise<FriendRequest[]> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("friendships")
      .select("id, sender_id, created_at")
      .eq("receiver_id", receiverId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch pending requests", { error: error.message, receiverId });
      throw new Error(error.message ?? "Failed to fetch pending requests");
    }

    if (!data || data.length === 0) return [];

    const senderIds = data.map((r) => r.sender_id);
    const profileMap = await this.fetchProfileMap(senderIds);

    return data.map((row) => {
      const profile = profileMap.get(row.sender_id);
      return {
        friendshipId: row.id,
        sender: {
          id: row.sender_id,
          displayName: profile?.username ?? "Unknown",
          avatarUrl: profile?.avatar_url ?? null,
        },
        createdAt: row.created_at ?? new Date().toISOString(),
      };
    });
  }

  /** Check the relationship status between two players. */
  static async getRelationshipStatus(
    userId: string,
    targetId: string
  ): Promise<RelationshipStatusResponse> {
    const supabase = await createRouteHandlerClient();

    // Check both directions: userId→targetId and targetId→userId
    const { data, error } = await supabase
      .from("friendships")
      .select("id, sender_id, receiver_id, status")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${userId})`
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch relationship status", {
        error: error.message,
        userId,
        targetId,
      });
      throw new Error(error.message ?? "Failed to fetch relationship status");
    }

    if (!data) {
      return { status: "none" };
    }

    if (data.status === "accepted") {
      return { status: "accepted", friendshipId: data.id };
    }

    // Pending: determine direction
    if (data.sender_id === userId) {
      return { status: "pending_sent", friendshipId: data.id };
    }
    return { status: "pending_received", friendshipId: data.id };
  }

  /** Send a friend request from sender to receiver. */
  static async sendRequest(senderId: string, receiverId: string) {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("friendships")
      .insert({ sender_id: senderId, receiver_id: receiverId, status: "pending" })
      .select()
      .single();

    if (error) {
      logger.error("Failed to send friend request", { error: error.message, senderId, receiverId });
      throw new Error(error.message ?? "Failed to send friend request");
    }

    return data;
  }

  /** Accept a pending friend request. Only the receiver can accept. */
  static async acceptRequest(friendshipId: string, receiverId: string) {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId)
      .eq("receiver_id", receiverId)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (error) {
      logger.error("Failed to accept friend request", {
        error: error.message,
        friendshipId,
        receiverId,
      });
      throw new Error(error.message ?? "Failed to accept friend request");
    }

    if (!data) {
      throw new Error("Friendship not found or not authorized");
    }

    return data;
  }

  /** Delete a friendship row. The user must be sender or receiver. */
  static async deleteRequest(friendshipId: string, userId: string) {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      logger.error("Failed to delete friendship", { error: error.message, friendshipId, userId });
      throw new Error(error.message ?? "Failed to delete friendship");
    }

    return { success: true };
  }

  /** Count accepted friendships for a player (both directions). */
  static async getFriendCount(playerId: string): Promise<number> {
    const supabase = await createRouteHandlerClient();

    // Count where player is sender
    const { count: senderCount, error: senderErr } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", playerId)
      .eq("status", "accepted");

    if (senderErr) {
      logger.error("Failed to count friendships as sender", { error: senderErr.message, playerId });
      throw new Error(senderErr.message ?? "Failed to count friendships as sender");
    }

    // Count where player is receiver
    const { count: receiverCount, error: receiverErr } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", playerId)
      .eq("status", "accepted");

    if (receiverErr) {
      logger.error("Failed to count friendships as receiver", {
        error: receiverErr.message,
        playerId,
      });
      throw new Error(receiverErr.message ?? "Failed to count friendships as receiver");
    }

    return (senderCount ?? 0) + (receiverCount ?? 0);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Fetch profiles by IDs and return a Map for quick lookup. */
  private static async fetchProfileMap(profileIds: string[]): Promise<Map<string, ProfileRow>> {
    if (profileIds.length === 0) return new Map();

    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", profileIds);

    if (error) {
      logger.error("Failed to fetch profiles for friends", { error: error.message, profileIds });
      throw new Error(error.message ?? "Failed to fetch profiles");
    }

    const map = new Map<string, ProfileRow>();
    for (const profile of data ?? []) {
      map.set(profile.id, profile);
    }
    return map;
  }
}
