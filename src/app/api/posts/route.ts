import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { PostWithAuthor, TagPostsResponse, PostMention } from "@/types/post";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const PAGE_SIZE = 20;
const TAG_REGEX = /^[a-z0-9_-]+$/;

const POST_SELECT =
  "id, player_id, content, image_url, created_at, updated_at, post_tags(tag), post_mentions(mentioned_player_id, profiles(id, username)), profiles(username, avatar_url)";

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
  profiles: { username: string | null; avatar_url: string | null } | null;
}

function transformRow(row: PostRow): PostWithAuthor {
  const tags = (row.post_tags ?? []).map((t) => t.tag);
  const mentions: PostMention[] = (row.post_mentions ?? [])
    .filter((m) => m.profiles !== null)
    .map((m) => ({ playerId: m.mentioned_player_id, username: m.profiles!.username }));

  return {
    id: row.id,
    playerId: row.player_id,
    content: row.content,
    imageUrl: row.image_url ?? null,
    tags,
    mentions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.profiles?.username ?? null,
    authorAvatar: row.profiles?.avatar_url ?? null,
  };
}

function emptyResponse(page: number): TagPostsResponse {
  return {
    posts: [],
    pagination: { currentPage: page, totalPages: 1, totalCount: 0, hasNextPage: false },
  };
}

/**
 * GET /api/posts — recent public posts feed.
 * Optional `?tag=xxx` filters posts by an exact normalized tag.
 * `?page=n` paginates (20 per page).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;
    const rawTag = searchParams.get("tag");
    const tag = rawTag ? rawTag.toLowerCase() : null;
    const rawSearch = searchParams.get("search");
    const search = rawSearch ? rawSearch.toLowerCase().replace(/[^a-z0-9_-]/g, "") : null;

    if (tag && !TAG_REGEX.test(tag)) {
      return NextResponse.json({ error: "Invalid tag format" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Wildcard tag search: matches posts whose tags contain the query substring.
    if (search) {
      if (search.length < 3) return NextResponse.json(emptyResponse(page));

      // Escape LIKE wildcards so `_` / `%` are matched literally.
      const escaped = search.replace(/[%_]/g, (c) => `\\${c}`);
      const { data: matchRows, error: matchError } = await supabase
        .from("post_tags" as UntypedFrom)
        .select("post_id")
        .ilike("tag", `%${escaped}%`)
        .limit(1000);

      if (matchError) {
        logger.error("Failed to search tags", { error: matchError.message, search });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      const uniqueIds = [
        ...new Set((matchRows as unknown as { post_id: string }[]).map((r) => r.post_id)),
      ];
      const totalCount = uniqueIds.length;
      if (totalCount === 0) return NextResponse.json(emptyResponse(page));

      const pageIds = uniqueIds.slice(offset, offset + PAGE_SIZE);
      const { data, error } = await supabase
        .from("player_posts" as UntypedFrom)
        .select(POST_SELECT)
        .in("id", pageIds)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to fetch searched posts", { error: error.message, search });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      const posts = ((data ?? []) as unknown as PostRow[]).map(transformRow);
      const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
      const response: TagPostsResponse = {
        posts,
        pagination: { currentPage: page, totalPages, totalCount, hasNextPage: page < totalPages },
      };
      return NextResponse.json(response);
    }

    // Tag-filtered feed
    if (tag) {
      const { count, error: countError } = await supabase
        .from("post_tags" as UntypedFrom)
        .select("id", { count: "exact", head: true })
        .eq("tag", tag);

      if (countError) {
        logger.error("Failed to count tag posts", { error: countError.message, tag });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      const totalCount = count ?? 0;
      if (totalCount === 0) return NextResponse.json(emptyResponse(page));

      const { data: tagRows, error: tagError } = await supabase
        .from("post_tags" as UntypedFrom)
        .select("post_id")
        .eq("tag", tag)
        .order("post_id", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (tagError) {
        logger.error("Failed to fetch tag post IDs", { error: tagError.message, tag });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      const postIds = (tagRows as unknown as { post_id: string }[]).map((r) => r.post_id);

      const { data, error } = await supabase
        .from("player_posts" as UntypedFrom)
        .select(POST_SELECT)
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to fetch tag posts", { error: error.message, tag });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      const posts = ((data ?? []) as unknown as PostRow[]).map(transformRow);
      const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
      const response: TagPostsResponse = {
        posts,
        pagination: { currentPage: page, totalPages, totalCount, hasNextPage: page < totalPages },
      };
      return NextResponse.json(response);
    }

    // Recent posts feed (no tag filter)
    const { count, error: countError } = await supabase
      .from("player_posts" as UntypedFrom)
      .select("id", { count: "exact", head: true });

    if (countError) {
      logger.error("Failed to count posts", { error: countError.message });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) return NextResponse.json(emptyResponse(page));

    const { data, error } = await supabase
      .from("player_posts" as UntypedFrom)
      .select(POST_SELECT)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      logger.error("Failed to fetch posts", { error: error.message });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const posts = ((data ?? []) as unknown as PostRow[]).map(transformRow);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const response: TagPostsResponse = {
      posts,
      pagination: { currentPage: page, totalPages, totalCount, hasNextPage: page < totalPages },
    };
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in posts GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
