// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export async function createSessionConversation(
  supabase: SupabaseClient,
  coachPlayerId: string,
  studentId: string,
  sessionId: string
): Promise<string> {
  // Check for existing conversation between the two users
  const { data: existing } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .in("player_id", [coachPlayerId, studentId]);

  const conversationId = findSharedConversation(existing);

  if (conversationId) {
    await linkConversationToSession(supabase, sessionId, conversationId);
    return conversationId;
  }

  // Create new conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({ type: "direct" })
    .select("id")
    .single();

  if (convError) throw convError;

  const newId: string = conversation.id;

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: newId, player_id: coachPlayerId },
      { conversation_id: newId, player_id: studentId },
    ]);

  if (partError) throw partError;

  await linkConversationToSession(supabase, sessionId, newId);
  return newId;
}

function findSharedConversation(
  rows: { conversation_id: string }[] | null
): string | null {
  if (!rows || rows.length < 2) return null;

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.conversation_id, (counts.get(row.conversation_id) ?? 0) + 1);
  }

  for (const [id, count] of counts) {
    if (count >= 2) return id;
  }
  return null;
}

async function linkConversationToSession(
  supabase: SupabaseClient,
  sessionId: string,
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from("coaching_sessions")
    .update({ conversation_id: conversationId })
    .eq("id", sessionId);

  if (error) throw error;
}
