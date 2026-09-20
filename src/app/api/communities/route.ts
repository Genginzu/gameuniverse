import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CommunityServerService } from "@/lib/services/communityServerService";
import { createCommunitySchema } from "@/lib/validations/community";
import { logger } from "@/lib/logger";
import type { CommunityListResponse, CommunitySearchParams } from "@/types/community";

const PAGE_SIZE = 20;

/** Parse the page query parameter, defaulting to 1. */
function parsePage(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw === null) return 1;
  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * GET /api/communities — Search/list public communities with optional filters.
 * Query params: search, gameId, genreId, page.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);

    const params: CommunitySearchParams = {
      search: searchParams.get("search") ?? undefined,
      gameId: searchParams.get("gameId") ?? undefined,
      genreId: searchParams.get("genreId") ?? undefined,
      page,
    };

    const { communities, totalCount } = await CommunityServerService.searchCommunities(params);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const response: CommunityListResponse = {
      communities,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in communities GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/communities — Create a new community.
 * Authentication required. The creator becomes the owner (auto-added via DB trigger).
 */
export async function POST(request: NextRequest) {
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
    const parsed = createCommunitySchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const community = await CommunityServerService.createCommunity(user.id, parsed.data);

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    logger.error("Error in communities POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
