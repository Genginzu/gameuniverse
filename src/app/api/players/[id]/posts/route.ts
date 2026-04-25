import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";
import { isValidImageUrl } from "@/lib/utils/postContentParser";
import { logger } from "@/lib/logger";
import { CoinService } from "@/lib/services/coinService";
import type { PostsResponse } from "@/types/post";

const PAGE_SIZE = 20;

function parsePage(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw === null) return 1;
  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * GET /api/players/[id]/posts — Paginated posts for a player.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Invalid player ID format" }, { status: 400 });
    }

    const playerExists = await PlayerService.playerExists(playerId);
    if (!playerExists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);
    const search = searchParams.get("search") || undefined;

    const { posts, totalCount } = await PlayerPostsServerService.fetchPosts(playerId, page, search);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const hasNextPage = page < totalPages;

    const response: PostsResponse = {
      posts,
      pagination: { currentPage: page, totalPages, totalCount, hasNextPage },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in player posts GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/players/[id]/posts — Create a new post.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Only the profile owner can post on their own profile
    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content : "";

    if (!content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Content exceeds 2000 characters" }, { status: 400 });
    }

    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : undefined;

    if (imageUrl && !isValidImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Invalid image URL (must be https://)" }, { status: 400 });
    }

    // Accept explicit tags from the client (TagInput component)
    const explicitTags = Array.isArray(body?.tags)
      ? body.tags.filter((t: unknown) => typeof t === "string" && t.length > 0).slice(0, 10)
      : undefined;

    const post = await PlayerPostsServerService.createPost(
      playerId,
      content,
      imageUrl,
      explicitTags
    );
    CoinService.rewardActivity(user.id, "post_create", post.id).catch((err) =>
      logger.error("Coin reward failed", { error: err })
    );

    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    logger.error("Error in player posts POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
