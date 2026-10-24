import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, notFound, validationError } from "@/lib/api/route";
import { commentSchema } from "@/lib/validations/comment";
import type { Comment, CommentsResponse } from "@/types/comment";
import { logger } from "@/lib/logger";
import { CoinService } from "@/lib/services/coinService";

/** characterId is read from the raw body, so the shared form schema must not strip it. */
const commentBodySchema = commentSchema.extend({ characterId: z.unknown().optional() });

interface CommentRow {
  id: string;
  /** NULL once the author deleted their account (comment anonymised). */
  user_id: string | null;
  character_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

/**
 * Sort comments by creation date descending (most recent first).
 */
export function sortCommentsByDateDesc<T extends { createdAt: string }>(comments: T[]): T[] {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Transform a database row into a Comment with profile info.
 */
function toComment(row: CommentRow, profilesMap: Map<string, ProfileRow>): Comment {
  const profile = row.user_id ? profilesMap.get(row.user_id) : undefined;
  return {
    id: row.id,
    userId: row.user_id,
    characterId: row.character_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    playerName: profile?.username ?? null,
    playerAvatar: profile?.avatar_url ?? null,
  };
}

/**
 * Fetch profiles for a list of user IDs.
 * Returns a Map keyed by user_id for O(1) lookup.
 */
async function fetchProfilesMap(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userIds: string[]
): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  if (error || !data) return map;

  for (const row of data as ProfileRow[]) {
    map.set(row.id, row);
  }
  return map;
}

/**
 * GET /api/comments?characterId=<uuid>
 *
 * Returns all comments for a character, sorted by date descending,
 * with player profiles and whether the current user has commented.
 */
export const GET = defineRoute({ auth: "optional" }, async ({ request, user }) => {
  const characterId = request.nextUrl.searchParams.get("characterId");
  if (!characterId) {
    throw validationError(undefined, "characterId query parameter is required");
  }

  const supabase = await createRouteHandlerClient();

  // Check if character exists
  const { data: character, error: characterError } = await supabase
    .from("characters")
    .select("id")
    .eq("id", characterId)
    .single();

  if (characterError || !character) throw notFound("Character not found");

  // Fetch comments ordered by created_at descending
  const { data: rows, error: commentsError } = await supabase
    .from("character_comments")
    .select("*")
    .eq("character_id", characterId)
    .order("created_at", { ascending: false });

  if (commentsError) {
    if (commentsError.code === "PGRST205") {
      const emptyResponse: CommentsResponse = {
        comments: [],
        totalCount: 0,
        userHasCommented: false,
      };
      return NextResponse.json(emptyResponse);
    }
    logger.error("Error fetching comments", { error: commentsError });
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }

  const commentRows = (rows ?? []) as CommentRow[];

  // Fetch profiles for all comment authors
  const userIds = [
    ...new Set(commentRows.map((r) => r.user_id).filter((id): id is string => id !== null)),
  ];
  const profilesMap = await fetchProfilesMap(supabase, userIds);

  // Transform rows to Comment objects
  const comments: Comment[] = commentRows.map((row) => toComment(row, profilesMap));

  // Check if current user has already commented
  const userHasCommented = user ? comments.some((c) => c.userId === user.id) : false;
  const userComment = user
    ? (comments.find((c) => c.userId === user.id) ?? undefined)
    : undefined;

  const response: CommentsResponse = {
    comments: sortCommentsByDateDesc(comments),
    totalCount: comments.length,
    userHasCommented,
    userComment,
  };

  return NextResponse.json(response);
});

/**
 * POST /api/comments
 *
 * Create a new comment for a character. Validates input with commentSchema.
 * Returns 409 if the user has already commented on this character.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "comment", writesContent: true, body: commentBodySchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();

    const { content } = body;
    const characterId = body.characterId as string;

    if (!characterId) {
      throw validationError(undefined, "characterId is required");
    }

    // Check if character exists
    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("id", characterId)
      .single();

    if (characterError || !character) throw notFound("Character not found");

    // Insert the comment
    const { data: comment, error: insertError } = await supabase
      .from("character_comments")
      .insert({
        user_id: user.id,
        character_id: characterId,
        content,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        throw conflict("Vous avez déjà laissé un commentaire pour ce personnage");
      }
      logger.error("Error inserting comment", { error: insertError });
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    CoinService.rewardActivity(user.id, "post_comment", comment.id).catch((err) =>
      logger.error("Coin reward failed", { error: err })
    );

    return NextResponse.json({ success: true, comment }, { status: 201 });
  }
);

/**
 * PUT /api/comments
 *
 * Update an existing comment. Only the comment author can update their comment.
 */
export const PUT = defineRoute(
  { auth: "required", rateLimit: "comment", writesContent: true, body: commentBodySchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();

    const { content } = body;
    const characterId = body.characterId as string;

    if (!characterId) {
      throw validationError(undefined, "characterId is required");
    }

    const { data: comment, error: updateError } = await supabase
      .from("character_comments")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("character_id", characterId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !comment) {
      logger.error("Error updating comment", { error: updateError });
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment });
  }
);
