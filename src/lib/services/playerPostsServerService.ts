import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { extractTags, extractMentions } from "@/lib/utils/postContentParser";
import type { Post, PostMention } from "@/types/post";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const PAGE_SIZE = 20;

/** Select string for enriched post queries (joins tags + mentions with profiles) */
const ENRICHED_SELECT =
  "id, player_id, content, image_url, created_at, updated_at, post_tags(tag), post_mentions(mentioned_player_id, profiles(id, username))";

/** Raw row shape from Supabase with joined data */
interface PostRow {
  id: string;
  player_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  post_tags: { tag: string }[];
  post_mentions: {
    mentioned_player_id: string;
    profiles: { id: string; username: string } | null;
  }[];
}

function transformRow(row: PostRow): Post {
  const tags = (row.post_tags ?? []).map((t) => t.tag);

  const mentions: PostMention[] = (row.post_mentions ?? [])
    .filter((m) => m.profiles !== null)
    .map((m) => ({
      playerId: m.mentioned_player_id,
      username: m.profiles!.username,
    }));

  return {
    id: row.id,
    playerId: row.player_id,
    content: row.content,
    imageUrl: row.image_url ?? null,
    tags,
    mentions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Server-side service for player posts.
 * Queries the player_posts table via Supabase.
 */
export class PlayerPostsServerService {
  /** Fetch paginated posts for a player, sorted by created_at DESC. */
  static async fetchPosts(
    playerId: string,
    page: number = 1,
    search?: string
  ): Promise<{ posts: Post[]; totalCount: number }> {
    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * PAGE_SIZE;

    // Build count query
    let countQuery = supabase
      .from("player_posts" as UntypedFrom)
      .select("id", { count: "exact", head: true })
      .eq("player_id", playerId);

    if (search) {
      countQuery = countQuery.ilike("content", `%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error("Failed to count player posts", { error: countError.message, playerId });
      throw new Error(countError.message ?? "Failed to count player posts");
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { posts: [], totalCount: 0 };
    }

    // Build data query with joins
    let dataQuery = supabase
      .from("player_posts" as UntypedFrom)
      .select(ENRICHED_SELECT)
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (search) {
      dataQuery = dataQuery.ilike("content", `%${search}%`);
    }

    const { data, error } = await dataQuery;

    if (error) {
      logger.error("Failed to fetch player posts", { error: error.message, playerId });
      throw new Error(error.message ?? "Failed to fetch player posts");
    }

    const posts = ((data ?? []) as unknown as PostRow[]).map(transformRow);
    return { posts, totalCount };
  }

  /** Create a new post and return it with enriched tags/mentions. */
  static async createPost(playerId: string, content: string, imageUrl?: string): Promise<Post> {
    const supabase = await createRouteHandlerClient();

    // 1. Insert the post
    const insertPayload: Record<string, unknown> = { player_id: playerId, content };
    if (imageUrl) {
      insertPayload.image_url = imageUrl;
    }

    const { data, error } = await supabase
      .from("player_posts" as UntypedFrom)
      .insert(insertPayload)
      .select(ENRICHED_SELECT)
      .single();

    if (error || !data) {
      logger.error("Failed to create player post", { error: error?.message, playerId });
      throw new Error(error?.message ?? "Failed to create player post");
    }

    const postId = (data as unknown as PostRow).id;

    // 2. Extract and insert tags (best-effort)
    const tags = extractTags(content);
    if (tags.length > 0) {
      const tagRows = tags.map((tag) => ({ post_id: postId, tag }));
      const { error: tagError } = await supabase.from("post_tags" as UntypedFrom).insert(tagRows);

      if (tagError) {
        logger.error("Failed to insert post tags", { error: tagError.message, postId });
      }
    }

    // 3. Extract mentions, resolve against profiles, insert (best-effort)
    const mentionNames = extractMentions(content);
    let resolvedMentions: PostMention[] = [];

    if (mentionNames.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles" as UntypedFrom)
        .select("id, username")
        .in("username", mentionNames);

      if (profileError) {
        logger.error("Failed to resolve mentions", { error: profileError.message, postId });
      } else if (profiles && profiles.length > 0) {
        const typedProfiles = profiles as unknown as { id: string; username: string }[];
        const mentionRows = typedProfiles.map((p) => ({
          post_id: postId,
          mentioned_player_id: p.id,
        }));

        const { error: mentionError } = await supabase
          .from("post_mentions" as UntypedFrom)
          .insert(mentionRows);

        if (mentionError) {
          logger.error("Failed to insert post mentions", { error: mentionError.message, postId });
        }

        resolvedMentions = typedProfiles.map((p) => ({
          playerId: p.id,
          username: p.username,
        }));
      }
    }

    // 4. Build enriched response
    const row = data as unknown as PostRow;
    return {
      id: row.id,
      playerId: row.player_id,
      content: row.content,
      imageUrl: row.image_url ?? null,
      tags,
      mentions: resolvedMentions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /** Delete a post by its ID. */
  static async deletePost(postId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase
      .from("player_posts" as UntypedFrom)
      .delete()
      .eq("id", postId);

    if (error) {
      logger.error("Failed to delete player post", { error: error.message, postId });
      throw new Error(error.message ?? "Failed to delete player post");
    }
  }

  /** Check if a post exists and return its player_id. */
  static async getPost(postId: string): Promise<{ id: string; playerId: string } | null> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("player_posts" as UntypedFrom)
      .select("id, player_id")
      .eq("id", postId)
      .single();

    if (error || !data) return null;
    const row = data as unknown as { id: string; player_id: string };
    return { id: row.id, playerId: row.player_id };
  }
}
