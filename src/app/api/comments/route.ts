import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { commentSchema } from "@/lib/validations/comment";
import type { Comment, CommentsResponse } from "@/types/comment";

interface CommentRow {
  id: string;
  user_id: string;
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
  const profile = profilesMap.get(row.user_id);
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
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const characterId = request.nextUrl.searchParams.get("characterId");
    if (!characterId) {
      return NextResponse.json(
        { error: "characterId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // Check if character exists
    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("id", characterId)
      .single();

    if (characterError || !character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

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
      console.error("Error fetching comments:", commentsError);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const commentRows = (rows ?? []) as CommentRow[];

    // Fetch profiles for all comment authors
    const userIds = [...new Set(commentRows.map((r) => r.user_id))];
    const profilesMap = await fetchProfilesMap(supabase, userIds);

    // Transform rows to Comment objects
    const comments: Comment[] = commentRows.map((row) => toComment(row, profilesMap));

    // Check if current user has already commented
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  } catch (error) {
    console.error("Error in comments GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/comments
 *
 * Create a new comment for a character. Validates input with commentSchema.
 * Returns 409 if the user has already commented on this character.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const { content } = parsed.data;
    const characterId = body.characterId;

    if (!characterId) {
      return NextResponse.json({ error: "characterId is required" }, { status: 400 });
    }

    // Check if character exists
    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("id", characterId)
      .single();

    if (characterError || !character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

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
        return NextResponse.json(
          { error: "Vous avez déjà laissé un commentaire pour ce personnage" },
          { status: 409 }
        );
      }
      console.error("Error inserting comment:", insertError);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error("Error in comments POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/comments
 *
 * Update an existing comment. Only the comment author can update their comment.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const { content } = parsed.data;
    const characterId = body.characterId;

    if (!characterId) {
      return NextResponse.json({ error: "characterId is required" }, { status: 400 });
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
      console.error("Error updating comment:", updateError);
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Error in comments PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
