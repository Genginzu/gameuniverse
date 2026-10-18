import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { CommunityPost } from "@/types/community";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

interface CommunityPostRow {
  id: string;
  community_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: { id: string; username: string | null; avatar_url: string | null } | null;
}

/**
 * Server-side service for community posts (the community's discussion feed).
 * Used by API routes under /api/communities/[slug]/posts.
 */
export class CommunityPostsServerService {
  /** Fetch posts for a community's feed, newest first. */
  static async fetchPosts(communityId: string): Promise<CommunityPost[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("community_posts" as UntypedFrom)
      .select(
        `id, community_id, author_id, content, created_at, updated_at,
         author:profiles!community_posts_author_id_fkey(id, username, avatar_url)`
      )
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch community posts", { error: error.message, communityId });
      throw new Error(error.message ?? "Failed to fetch community posts");
    }

    return ((data ?? []) as unknown as CommunityPostRow[]).map(transformPostRow);
  }

  /** Create a post in a community. Caller must have verified membership beforehand. */
  static async createPost(
    communityId: string,
    authorId: string,
    content: string
  ): Promise<CommunityPost> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("community_posts" as UntypedFrom)
      .insert({ community_id: communityId, author_id: authorId, content })
      .select(
        `id, community_id, author_id, content, created_at, updated_at,
         author:profiles!community_posts_author_id_fkey(id, username, avatar_url)`
      )
      .single();

    if (error) {
      logger.error("Failed to create community post", { error: error.message, communityId });
      throw new Error(error.message ?? "Failed to create community post");
    }

    return transformPostRow(data as unknown as CommunityPostRow);
  }

  /** Fetch a single post's community_id and author_id, for authorization checks. */
  static async getPostAccess(
    postId: string
  ): Promise<{ communityId: string; authorId: string } | null> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("community_posts" as UntypedFrom)
      .select("community_id, author_id")
      .eq("id", postId)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as unknown as { community_id: string; author_id: string };
    return { communityId: row.community_id, authorId: row.author_id };
  }

  /** Delete a post. Caller must have verified author/owner/moderator role beforehand. */
  static async deletePost(postId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase
      .from("community_posts" as UntypedFrom)
      .delete()
      .eq("id", postId);

    if (error) {
      logger.error("Failed to delete community post", { error: error.message, postId });
      throw new Error(error.message ?? "Failed to delete community post");
    }
  }
}

function transformPostRow(row: CommunityPostRow): CommunityPost {
  return {
    id: row.id,
    communityId: row.community_id,
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
