import { NextRequest, NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { GroupServerService } from "@/lib/services/groupServerService";
import { createGroupSchema } from "@/lib/validations/group";
import { logger } from "@/lib/logger";
import type { GroupListResponse, GroupSearchParams } from "@/types/group";

const PAGE_SIZE = 20;

/** Parse the page query parameter, defaulting to 1. */
function parsePage(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw === null) return 1;
  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * GET /api/groups — Search/list public groups with optional filters.
 * Query params: search, gameId, genreId, page.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);

    const params: GroupSearchParams = {
      search: searchParams.get("search") ?? undefined,
      gameId: searchParams.get("gameId") ?? undefined,
      genreId: searchParams.get("genreId") ?? undefined,
      page,
    };

    const { groups, totalCount } = await GroupServerService.searchGroups(params);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const response: GroupListResponse = {
      groups,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in groups GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/groups — Create a new group.
 * Authentication required. The creator becomes the owner (auto-added via DB trigger).
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "groupCreate", writesContent: true, body: createGroupSchema },
  async ({ user, body }) => {
    const group = await GroupServerService.createGroup(user.id, body);

    return NextResponse.json({ group }, { status: 201 });
  }
);
