import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";
import { isValidImageUrl } from "@/lib/utils/postContentParser";
import { logger } from "@/lib/logger";
import { rewardActivity } from "@/lib/services/activityRewards";
import type { PostsResponse } from "@/types/post";

const PAGE_SIZE = 20;

const postBodySchema = z.looseObject({
  content: z.unknown().optional(),
  imageUrl: z.unknown().optional(),
  tags: z.unknown().optional(),
});

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
export const POST = defineRoute(
  { auth: "required", rateLimit: "post", writesContent: true, body: postBodySchema },
  async ({ user, params, body }) => {
    const { id: playerId } = params;

    // Only the profile owner can post on their own profile
    if (user.id !== playerId) throw forbidden("Forbidden");

    const content = typeof body.content === "string" ? body.content : "";

    if (!content.trim()) {
      throw validationError(undefined, "Content is required");
    }

    if (content.length > 2000) {
      throw validationError(undefined, "Content exceeds 2000 characters");
    }

    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined;

    if (imageUrl && !isValidImageUrl(imageUrl)) {
      throw validationError(undefined, "Invalid image URL (must be https://)");
    }

    // Accept explicit tags from the client (TagInput component)
    const explicitTags = Array.isArray(body.tags)
      ? body.tags
          .filter((t: unknown): t is string => typeof t === "string" && t.length > 0)
          .slice(0, 10)
      : undefined;

    const post = await PlayerPostsServerService.createPost(
      playerId,
      content,
      imageUrl,
      explicitTags
    );
    await rewardActivity({ kind: "post_created", userId: user.id, postId: post.id });

    return NextResponse.json(post, { status: 201 });
  }
);
