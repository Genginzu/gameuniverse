import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { GroupPost } from "@/types/group";

// Tables not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

interface GroupPostRow {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: { id: string; username: string | null; avatar_url: string | null } | null;
}

/**
 * Server-side service for group posts (the group's discussion feed).
 * Used by API routes under /api/groups/[slug]/posts.
 */
export class GroupPostsServerService {
  /** Fetch posts for a group's feed, newest first. */
  static async fetchPosts(groupId: string): Promise<GroupPost[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("group_posts" as UntypedFrom)
      .select(
        `id, group_id, author_id, content, created_at, updated_at,
         author:profiles!group_posts_author_id_fkey(id, username, avatar_url)`
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch group posts", { error: error.message, groupId });
      throw new Error(error.message ?? "Failed to fetch group posts");
    }

    return ((data ?? []) as unknown as GroupPostRow[]).map(transformPostRow);
  }

  /** Create a post in a group. Caller must have verified membership beforehand. */
  static async createPost(groupId: string, authorId: string, content: string): Promise<GroupPost> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("group_posts" as UntypedFrom)
      .insert({ group_id: groupId, author_id: authorId, content })
      .select(
        `id, group_id, author_id, content, created_at, updated_at,
         author:profiles!group_posts_author_id_fkey(id, username, avatar_url)`
      )
      .single();

    if (error) {
      logger.error("Failed to create group post", { error: error.message, groupId });
      throw new Error(error.message ?? "Failed to create group post");
    }

    return transformPostRow(data as unknown as GroupPostRow);
  }

  /** Fetch a single post's group_id and author_id, for authorization checks. */
  static async getPostAccess(
    postId: string
  ): Promise<{ groupId: string; authorId: string } | null> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("group_posts" as UntypedFrom)
      .select("group_id, author_id")
      .eq("id", postId)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as unknown as { group_id: string; author_id: string };
    return { groupId: row.group_id, authorId: row.author_id };
  }

  /** Delete a post. Caller must have verified author/owner/admin role beforehand. */
  static async deletePost(postId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.from("group_posts" as UntypedFrom).delete().eq("id", postId);

    if (error) {
      logger.error("Failed to delete group post", { error: error.message, postId });
      throw new Error(error.message ?? "Failed to delete group post");
    }
  }
}

function transformPostRow(row: GroupPostRow): GroupPost {
  return {
    id: row.id,
    groupId: row.group_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author?.id ?? row.author_id,
      username: row.author?.username ?? null,
      avatarUrl: row.author?.avatar_url ?? null,
    },
  };
}
