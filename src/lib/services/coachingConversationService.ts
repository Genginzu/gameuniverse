import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { canonicalParticipants } from "@/lib/utils/discussion-utils";

const UNIQUE_VIOLATION = "23505";

/**
 * Opens (or reuses) the 1-to-1 conversation between a coach and a student and
 * links it to the session. Runs with the service role: coach and student are
 * not necessarily friends, and coaching_sessions.conversation_id is server-only.
 */
export async function createSessionConversation(
  coachPlayerId: string,
  studentId: string,
  sessionId: string,
  admin: SupabaseClient = getSupabaseAdmin()
): Promise<string | null> {
  if (coachPlayerId === studentId) return null;

  const conversationId = await findOrCreateConversation(admin, coachPlayerId, studentId);

  const { error } = await admin
    .from("coaching_sessions")
    .update({ conversation_id: conversationId })
    .eq("id", sessionId);
  if (error) throw error;

  return conversationId;
}

async function findOrCreateConversation(
  admin: SupabaseClient,
  playerA: string,
  playerB: string
): Promise<string> {
  const [participant1, participant2] = canonicalParticipants(playerA, playerB);

  const existingId = await findConversation(admin, participant1, participant2);
  if (existingId) return existingId;

  const { data: created, error } = await admin
    .from("conversations")
    .insert({ participant_1: participant1, participant_2: participant2 })
    .select("id")
    .single();

  if (!error && created) return created.id as string;

  // A concurrent request created the same pair in between: reuse it.
  if (error?.code === UNIQUE_VIOLATION) {
    const racedId = await findConversation(admin, participant1, participant2);
    if (racedId) return racedId;
  }
  throw error ?? new Error("Failed to create coaching conversation");
}

async function findConversation(
  admin: SupabaseClient,
  participant1: string,
  participant2: string
): Promise<string | null> {
  const { data, error } = await admin
    .from("conversations")
    .select("id")
    .eq("participant_1", participant1)
    .eq("participant_2", participant2)
    .maybeSingle();

  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}
