import type { SupabaseClient } from "@supabase/supabase-js";

export interface MatchComment {
  id: string;
  matchId: string;
  matchSource: "internal" | "pandascore";
  /** null once the author deleted their account: shown as "Deleted user". */
  playerId: string | null;
  playerName: string | null;
  playerAvatar: string | null;
  content: string;
  reactions: Record<string, string[]>;
  createdAt: string;
}

interface CommentRow {
  id: string;
  match_id: string;
  match_source: string;
  player_id: string | null;
  content: string;
  reactions: Record<string, string[]>;
  created_at: string;
}

interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

function toMatchComment(row: CommentRow, profilesMap: Map<string, ProfileRow>): MatchComment {
  const profile = row.player_id ? profilesMap.get(row.player_id) : undefined;
  return {
    id: row.id,
    matchId: row.match_id,
    matchSource: row.match_source as "internal" | "pandascore",
    playerId: row.player_id,
    playerName: profile?.username ?? null,
    playerAvatar: profile?.avatar_url ?? null,
    content: row.content,
    reactions: row.reactions ?? {},
    createdAt: row.created_at,
  };
}

async function fetchProfilesMap(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>();
  if (userIds.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  if (data) for (const row of data as ProfileRow[]) map.set(row.id, row);
  return map;
}

export async function getComments(
  supabase: SupabaseClient,
  matchId: string,
  matchSource: string = "pandascore"
): Promise<MatchComment[]> {
  const { data, error } = await supabase
    .from("match_comments")
    .select("*")
    .eq("match_id", matchId)
    .eq("match_source", matchSource)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as CommentRow[];
  const userIds = [
    ...new Set(rows.map((r) => r.player_id).filter((id): id is string => id !== null)),
  ];
  const profilesMap = await fetchProfilesMap(supabase, userIds);
  return rows.map((row) => toMatchComment(row, profilesMap));
}

export async function addComment(
  supabase: SupabaseClient,
  params: { matchId: string; matchSource: string; playerId: string; content: string }
): Promise<MatchComment> {
  const { data, error } = await supabase
    .from("match_comments")
    .insert({
      match_id: params.matchId,
      match_source: params.matchSource,
      player_id: params.playerId,
      content: params.content,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const row = data as CommentRow;
  const profilesMap = await fetchProfilesMap(supabase, [params.playerId]);
  return toMatchComment(row, profilesMap);
}

/**
 * Toggles the caller's reaction through toggle_match_comment_reaction
 * (migration 20261019000003): the RPC adds or removes auth.uid() only, under a
 * row lock, so reactions cannot be forged and any signed-in user can react.
 */
export async function addReaction(
  supabase: SupabaseClient,
  commentId: string,
  emoji: string
): Promise<MatchComment> {
  const { data, error } = await supabase.rpc("toggle_match_comment_reaction", {
    p_comment_id: commentId,
    p_emoji: emoji,
  });

  if (error || !data) throw new Error(error?.message ?? "Comment not found");
  const updatedRow = data as CommentRow;
  const profilesMap = await fetchProfilesMap(
    supabase,
    updatedRow.player_id ? [updatedRow.player_id] : []
  );
  return toMatchComment(updatedRow, profilesMap);
}
