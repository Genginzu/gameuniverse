import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { PostWithAuthor, TagPostsResponse, PostMention } from "@/types/post";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const PAGE_SIZE = 20;
const TAG_REGEX = /^[a-z0-9_-]+$/;

interface TagPostRow {
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

function transformRow(row: TagPostRow): PostWithAuthor {
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ tag: string }> }) {
  try {
    const { tag } = await params;
    const normalizedTag = tag.toLowerCase();

    if (!TAG_REGEX.test(normalizedTag)) {
      return NextResponse.json({ error: "Invalid tag format" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const supabase = await createRouteHandlerClient();

    // Count posts with this tag
    const { count, error: countError } = await supabase
      .from("post_tags" as UntypedFrom)
      .select("id", { count: "exact", head: true })
      .eq("tag", normalizedTag);

    if (countError) {
      logger.error("Failed to count tag posts", { error: countError.message, tag: normalizedTag });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      const response: TagPostsResponse = {
        posts: [],
        pagination: { currentPage: page, totalPages: 1, totalCount: 0, hasNextPage: false },
      };
      return NextResponse.json(response);
    }

    // Fetch post IDs for this tag, ordered by creation date
    const { data: tagRows, error: tagError } = await supabase
      .from("post_tags" as UntypedFrom)
      .select("post_id")
      .eq("tag", normalizedTag)
      .order("post_id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (tagError) {
      logger.error("Failed to fetch tag post IDs", { error: tagError.message, tag: normalizedTag });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const postIds = (tagRows as unknown as { post_id: string }[]).map((r) => r.post_id);

    // Fetch enriched posts with author info
    const { data, error } = await supabase
      .from("player_posts" as UntypedFrom)
      .select(
        "id, player_id, content, image_url, created_at, updated_at, post_tags(tag), post_mentions(mentioned_player_id, profiles(id, username)), profiles(username, avatar_url)"
      )
      .in("id", postIds)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch tag posts", { error: error.message, tag: normalizedTag });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const posts = ((data ?? []) as unknown as TagPostRow[]).map(transformRow);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const response: TagPostsResponse = {
      posts,
      pagination: { currentPage: page, totalPages, totalCount, hasNextPage: page < totalPages },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in tag posts GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
