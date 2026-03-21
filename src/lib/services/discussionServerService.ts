import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { ConversationSummary, Message, MessagesResponse } from "@/types/discussion";
import { canonicalParticipants } from "@/lib/utils/discussion-utils";
import {
  fetchProfileMap,
  fetchLastMessages,
  fetchUnreadCounts,
} from "@/lib/services/discussionQueryHelpers";

const MSG_COLS = "id, conversation_id, sender_id, content, created_at, read_at" as const;

function toMessage(r: Record<string, string | null>): Message {
  return {
    id: r.id!,
    conversationId: r.conversation_id!,
    senderId: r.sender_id!,
    content: r.content!,
    createdAt: r.created_at!,
    readAt: r.read_at,
  };
}

/**
 * Server-side service for discussion (messaging) operations.
 * Each method creates its own Supabase route-handler client.
 */
export class DiscussionServerService {
  /** List conversations with friend profile, last message and unread count. */
  static async getConversations(userId: string): Promise<ConversationSummary[]> {
    const supabase = await createRouteHandlerClient();

    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (convError) {
      logger.error("Failed to fetch conversations", { error: convError.message, userId });
      throw new Error(convError.message ?? "Failed to fetch conversations");
    }
    if (!conversations || conversations.length === 0) return [];

    const friendIds = conversations.map((c) =>
      c.participant_1 === userId ? c.participant_2 : c.participant_1
    );
    const conversationIds = conversations.map((c) => c.id);

    // Batch: profils, derniers messages et compteurs non lus en parallèle
    const [profileMap, lastMessagesMap, unreadCountsMap] = await Promise.all([
      fetchProfileMap(friendIds),
      fetchLastMessages(conversationIds),
      fetchUnreadCounts(conversationIds, userId),
    ]);

    const summaries: ConversationSummary[] = conversations.map((conv) => {
      const friendId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
      const profile = profileMap.get(friendId);
      const lastMessage = lastMessagesMap.get(conv.id) ?? null;
      const unreadCount = unreadCountsMap.get(conv.id) ?? 0;

      return {
        id: conv.id,
        friend: {
          id: friendId,
          displayName: profile?.username ?? "Unknown",
          avatarUrl: profile?.avatar_url ?? null,
        },
        lastMessage,
        unreadCount,
      };
    });

    // Sort by most recent message first; no-message conversations go last
    summaries.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
    });
    return summaries;
  }

  /** Create a conversation. Verifies friendship. Idempotent: returns existing if any. */
  static async createConversation(userId: string, friendId: string): Promise<{ id: string }> {
    const supabase = await createRouteHandlerClient();

    const { data: friendship, error: friendErr } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
      )
      .eq("status", "accepted")
      .limit(1)
      .maybeSingle();

    if (friendErr) {
      logger.error("Failed to verify friendship", { error: friendErr.message, userId, friendId });
      throw new Error(friendErr.message ?? "Failed to verify friendship");
    }
    if (!friendship) throw new Error("Cannot create conversation: not friends");

    const [p1, p2] = canonicalParticipants(userId, friendId);

    const { data: existing, error: existErr } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", p1)
      .eq("participant_2", p2)
      .maybeSingle();

    if (existErr) {
      logger.error("Failed to check existing conversation", {
        error: existErr.message,
        userId,
        friendId,
      });
      throw new Error(existErr.message ?? "Failed to check existing conversation");
    }
    if (existing) return { id: existing.id };

    const { data: created, error: createErr } = await supabase
      .from("conversations")
      .insert({ participant_1: p1, participant_2: p2 })
      .select("id")
      .single();

    if (createErr) {
      logger.error("Failed to create conversation", { error: createErr.message, userId, friendId });
      throw new Error(createErr.message ?? "Failed to create conversation");
    }
    return { id: created.id };
  }

  /** Get paginated messages (cursor-based). Returns in ascending order for display. */
  static async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit: number = 30
  ): Promise<MessagesResponse> {
    const supabase = await createRouteHandlerClient();
    await this.verifyParticipation(conversationId, userId);

    let query = supabase
      .from("messages")
      .select(MSG_COLS)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to fetch messages", { error: error.message, conversationId });
      throw new Error(error.message ?? "Failed to fetch messages");
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    sliced.reverse(); // ascending order for display
    const messages = sliced.map(toMessage);
    const nextCursor = sliced.length > 0 ? sliced[0].created_at : null;
    return { messages, hasMore, nextCursor };
  }

  /** Send a message in a conversation. Verifies user participation. */
  static async sendMessage(
    conversationId: string,
    userId: string,
    content: string
  ): Promise<Message> {
    const supabase = await createRouteHandlerClient();
    await this.verifyParticipation(conversationId, userId);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, content })
      .select(MSG_COLS)
      .single();

    if (error) {
      logger.error("Failed to send message", { error: error.message, conversationId, userId });
      throw new Error(error.message ?? "Failed to send message");
    }
    return toMessage(data);
  }

  /** Mark unread messages as read. Only affects messages where sender != userId. */
  static async markAsRead(conversationId: string, userId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    await this.verifyParticipation(conversationId, userId);

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      logger.error("Failed to mark messages as read", { error: error.message, conversationId });
      throw new Error(error.message ?? "Failed to mark messages as read");
    }
  }

  /** Count all unread messages across all user's conversations. */
  static async getUnreadCount(userId: string): Promise<number> {
    const supabase = await createRouteHandlerClient();

    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (convError) {
      logger.error("Failed to fetch conversations for unread count", {
        error: convError.message,
        userId,
      });
      throw new Error(convError.message ?? "Failed to fetch conversations");
    }
    if (!conversations || conversations.length === 0) return 0;

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in(
        "conversation_id",
        conversations.map((c) => c.id)
      )
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      logger.error("Failed to count unread messages", { error: error.message, userId });
      throw new Error(error.message ?? "Failed to count unread messages");
    }
    return count ?? 0;
  }

  // Private helpers
  private static async verifyParticipation(conversationId: string, userId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .maybeSingle();

    if (error) {
      logger.error("Failed to verify participation", { error: error.message, conversationId });
      throw new Error(error.message ?? "Failed to verify participation");
    }
    if (!data) throw new Error("Conversation not found");
  }
}
