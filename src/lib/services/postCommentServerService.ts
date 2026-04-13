import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import type { PostComment } from "@/types/post-comment";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/** Raw row shape from Supabase post_comments table with joined profile */
interface CommentRow {
  id: string;
  post_id: string;
  player_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

function transformRow(row: CommentRow): PostComment {
  return {
    id: row.id,
    postId: row.post_id,
    playerId: row.player_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    player: row.profiles
      ? { username: row.profiles.username, avatarUrl: row.profiles.avatar_url }
      : undefined,
  };
}

/**
 * Server-side service for post comments.
 * Queries the post_comments table via Supabase.
 */
export class PostCommentServerService {
  /** Fetch all comments for a post, sorted by created_at ASC, with player info. */
  static async getComments(
    postId: string
  ): Promise<{ comments: PostComment[]; totalCount: number }> {
    const supabase = await createRouteHandlerClient();

    // Count query
    const { count, error: countError } = await supabase
      .from("post_comments" as UntypedFrom)
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);

    if (countError) {
      logger.error("Failed to count post comments", { error: countError.message, postId });
      throw new Error(countError.message ?? "Failed to count post comments");
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { comments: [], totalCount: 0 };
    }

    // Data query with profile join
    const { data, error } = await supabase
      .from("post_comments" as UntypedFrom)
      .select(
        "id, post_id, player_id, content, created_at, updated_at, profiles:player_id(username, avatar_url)"
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Failed to fetch post comments", { error: error.message, postId });
      throw new Error(error.message ?? "Failed to fetch post comments");
    }

    const comments = ((data ?? []) as unknown as CommentRow[]).map(transformRow);
    return { comments, totalCount };
  }

  /** Create a comment on a post and trigger a notification for the post owner. */
  static async createComment(
    postId: string,
    playerId: string,
    content: string
  ): Promise<PostComment> {
    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 500) {
      throw new Error("Content must be between 1 and 500 characters");
    }

    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("post_comments" as UntypedFrom)
      .insert({ post_id: postId, player_id: playerId, content: trimmed })
      .select(
        "id, post_id, player_id, content, created_at, updated_at, profiles:player_id(username, avatar_url)"
      )
      .single();

    if (error || !data) {
      logger.error("Failed to create post comment", { error: error?.message, postId, playerId });
      throw new Error(error?.message ?? "Failed to create post comment");
    }

    const comment = transformRow(data as unknown as CommentRow);

    // Get the post owner to send notification (best-effort)
    try {
      const { data: post } = await supabase
        .from("player_posts" as UntypedFrom)
        .select("player_id")
        .eq("id", postId)
        .single();

      if (post) {
        const postOwnerId = (post as unknown as { player_id: string }).player_id;
        await NotificationServerService.create(
          postOwnerId,
          playerId,
          "post_comment",
          postId,
          trimmed
        );
      }
    } catch (err) {
      logger.error("Failed to create notification for post comment", {
        error: err instanceof Error ? err.message : String(err),
        postId,
        playerId,
      });
    }

    return comment;
  }

  /** Delete a comment. Allowed for the comment author or the post owner. */
  static async deleteComment(
    commentId: string,
    playerId: string,
    postOwnerId: string
  ): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Fetch the comment to verify existence and ownership
    const { data: existing, error: fetchError } = await supabase
      .from("post_comments" as UntypedFrom)
      .select("id, player_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !existing) {
      throw new Error("Comment not found");
    }

    const commentOwnerId = (existing as unknown as { player_id: string }).player_id;

    if (playerId !== commentOwnerId && playerId !== postOwnerId) {
      throw new Error("Forbidden");
    }

    const { error } = await supabase
      .from("post_comments" as UntypedFrom)
      .delete()
      .eq("id", commentId);

    if (error) {
      logger.error("Failed to delete post comment", { error: error.message, commentId });
      throw new Error(error.message ?? "Failed to delete post comment");
    }
  }
}
