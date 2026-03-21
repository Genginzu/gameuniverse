import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface LastMessageEntry {
  content: string;
  senderId: string;
  createdAt: string;
}

/** Batch fetch: profils utilisateurs par IDs. */
export async function fetchProfileMap(profileIds: string[]): Promise<Map<string, ProfileRow>> {
  if (profileIds.length === 0) return new Map();
  const supabase = await createRouteHandlerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", profileIds);

  if (error) {
    logger.error("Failed to fetch profiles", { error: error.message, profileIds });
    throw new Error(error.message ?? "Failed to fetch profiles");
  }

  const map = new Map<string, ProfileRow>();
  for (const profile of data ?? []) map.set(profile.id, profile);
  return map;
}

/** Batch fetch: dernier message de chaque conversation en une seule requête. */
export async function fetchLastMessages(
  conversationIds: string[]
): Promise<Map<string, LastMessageEntry>> {
  if (conversationIds.length === 0) return new Map();
  const supabase = await createRouteHandlerClient();

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, content, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to batch fetch last messages", { error: error.message });
    throw new Error(error.message ?? "Failed to batch fetch last messages");
  }

  // Garder uniquement le premier (plus récent) par conversation
  const map = new Map<string, LastMessageEntry>();
  for (const row of data ?? []) {
    if (!map.has(row.conversation_id)) {
      map.set(row.conversation_id, {
        content: row.content,
        senderId: row.sender_id,
        createdAt: row.created_at,
      });
    }
  }
  return map;
}

/** Batch fetch: compteurs de messages non lus par conversation en une seule requête. */
export async function fetchUnreadCounts(
  conversationIds: string[],
  userId: string
): Promise<Map<string, number>> {
  if (conversationIds.length === 0) return new Map();
  const supabase = await createRouteHandlerClient();

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (error) {
    logger.error("Failed to batch fetch unread counts", { error: error.message });
    throw new Error(error.message ?? "Failed to batch fetch unread counts");
  }

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.conversation_id, (map.get(row.conversation_id) ?? 0) + 1);
  }
  return map;
}
