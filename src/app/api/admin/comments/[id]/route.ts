import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { commentSchema } from "@/lib/validations/comment";
import type { AdminCommentDetail } from "@/types/admin-comments";
import { logger } from "@/lib/logger";

/** Row shape returned by the detail query */
interface CommentDetailRow {
  id: string;
  user_id: string;
  character_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  characters: {
    character_translations: Array<{ name: string }>;
  } | null;
}

function toAdminCommentDetail(
  row: CommentDetailRow,
  playerName: string | null
): AdminCommentDetail {
  return {
    id: row.id,
    userId: row.user_id,
    characterId: row.character_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    playerName,
    characterName: row.characters?.character_translations?.[0]?.name ?? "",
  };
}

const DETAIL_SELECT = `
  id, user_id, character_id, content,
  created_at, updated_at,
  characters(character_translations(name))
`;

/** Fetch username from profiles table by user_id */
async function fetchPlayerName(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).single();
  return data?.username ?? null;
}

/**
 * GET /api/admin/comments/[id] — Full comment detail for editing
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: commentId } = params;

  if (!commentId) throw validationError(undefined, "Comment ID is required");

  const supabase = await createRouteHandlerClient();

  const { data, error } = await supabase
    .from("character_comments")
    .select(DETAIL_SELECT)
    .eq("id", commentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") throw notFound("Comment not found");
    logger.error("Error fetching comment", { error });
    return NextResponse.json({ error: "Failed to fetch comment" }, { status: 500 });
  }

  if (!data) throw notFound("Comment not found");

  const row = data as unknown as CommentDetailRow;
  const playerName = await fetchPlayerName(supabase, row.user_id);

  return NextResponse.json(toAdminCommentDetail(row, playerName));
});

/**
 * PUT /api/admin/comments/[id] — Update a comment
 */
export const PUT = defineRoute(
  { auth: "admin", body: commentSchema },
  async ({ params, body }) => {
    const { id: commentId } = params;

    if (!commentId) throw validationError(undefined, "Comment ID is required");

    const { content } = body;
    const supabase = await createRouteHandlerClient();

    // Check existence
    const { data: existing, error: checkError } = await supabase
      .from("character_comments")
      .select("id")
      .eq("id", commentId)
      .single();

    if (checkError || !existing) throw notFound("Comment not found");

    // Update
    const { error: updateError } = await supabase
      .from("character_comments")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (updateError) {
      logger.error("Error updating comment", { error: updateError });
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }

    // Fetch updated comment
    const { data: updated, error: fetchError } = await supabase
      .from("character_comments")
      .select(DETAIL_SELECT)
      .eq("id", commentId)
      .single();

    if (fetchError || !updated) {
      logger.error("Error fetching updated comment", { error: fetchError });
      return NextResponse.json({ error: "Failed to fetch updated comment" }, { status: 500 });
    }

    const row = updated as unknown as CommentDetailRow;
    const playerName = await fetchPlayerName(supabase, row.user_id);

    return NextResponse.json(toAdminCommentDetail(row, playerName));
  }
);

/**
 * DELETE /api/admin/comments/[id] — Delete a comment
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: commentId } = params;

  if (!commentId) throw validationError(undefined, "Comment ID is required");

  const supabase = await createRouteHandlerClient();

  // Check existence
  const { data: existing, error: checkError } = await supabase
    .from("character_comments")
    .select("id")
    .eq("id", commentId)
    .single();

  if (checkError || !existing) throw notFound("Comment not found");

  const { error: deleteError } = await supabase
    .from("character_comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    logger.error("Error deleting comment", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
