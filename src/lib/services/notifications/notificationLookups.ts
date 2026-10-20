import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Row = Record<string, string | null | undefined>;

async function singleColumn(
  table: string,
  column: string,
  filterColumn: string,
  value: string
): Promise<Row | null> {
  const { data } = await getSupabaseAdmin()
    .from(table)
    .select(column)
    .eq(filterColumn, value)
    .single();
  return (data as unknown as Row | null) ?? null;
}

function columnValues(rows: unknown, column: string): string[] {
  return ((rows ?? []) as Row[]).map((row) => row[column]).filter((id): id is string => !!id);
}

export async function findPostOwnerId(postId: string): Promise<string | null> {
  const post = await singleColumn("player_posts", "player_id", "id", postId);
  return post?.player_id ?? null;
}

export async function findCoachPlayerId(coachProfileId: string): Promise<string | null> {
  const coach = await singleColumn("coach_profiles", "player_id", "id", coachProfileId);
  return coach?.player_id ?? null;
}

export async function findSessionCoachPlayerId(sessionId: string): Promise<string | null> {
  const session = await singleColumn("coaching_sessions", "coach_id", "id", sessionId);
  return session?.coach_id ? findCoachPlayerId(session.coach_id) : null;
}

export async function findOtherParticipantId(
  conversationId: string,
  participantId: string
): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single();
  const conversation = data as unknown as Row | null;
  if (!conversation) return null;
  const other =
    conversation.participant_1 === participantId
      ? conversation.participant_2
      : conversation.participant_1;
  return other ?? null;
}

export async function findFollowerIds(authorId: string): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const [subscriptions, friendsAsSender, friendsAsReceiver] = await Promise.all([
    admin.from("player_subscriptions").select("subscriber_id").eq("target_id", authorId),
    admin
      .from("friendships")
      .select("receiver_id")
      .eq("sender_id", authorId)
      .eq("status", "accepted"),
    admin
      .from("friendships")
      .select("sender_id")
      .eq("receiver_id", authorId)
      .eq("status", "accepted"),
  ]);

  const followerIds = new Set([
    ...columnValues(subscriptions.data, "subscriber_id"),
    ...columnValues(friendsAsSender.data, "receiver_id"),
    ...columnValues(friendsAsReceiver.data, "sender_id"),
  ]);
  followerIds.delete(authorId);
  return Array.from(followerIds);
}
