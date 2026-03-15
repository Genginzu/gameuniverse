import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerCollectionsServerService } from "@/lib/services/playerCollectionsServerService";
import { fetchCollections, createCollection } from "@/lib/services/collectionService";
import { AchievementEngine } from "@/lib/services/achievementEngine";
import { createCollectionSchema } from "@/lib/validations/collection";
import { logger } from "@/lib/logger";
import type { CollectionSortOption, PlayerCollectionsResponse } from "@/types/playerCollection";

type RouteContext = { params: Promise<{ id: string }> };

const PAGE_SIZE = 12;

/** Valid sort options for paginated mode */
const VALID_SORT_OPTIONS: Set<string> = new Set([
  "updated_at_desc",
  "name_asc",
  "name_desc",
  "games_count_desc",
]);

/**
 * Parse and validate the page query parameter.
 * Returns 1 for invalid values, null if not provided.
 */
function parsePage(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get("page");
  if (raw === null) return null;

  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * Parse the sort query parameter.
 * Falls back to "updated_at_desc" for invalid or missing values.
 */
function parseSort(searchParams: URLSearchParams): CollectionSortOption {
  const raw = searchParams.get("sort");
  if (raw !== null && VALID_SORT_OPTIONS.has(raw)) {
    return raw as CollectionSortOption;
  }
  return "updated_at_desc";
}

/**
 * GET /api/players/[id]/collections
 *
 * Two modes:
 * 1. Legacy (no `page` param): returns all collections via collectionService (backward compat)
 * 2. Paginated (`page` param present): returns paginated collections with stats and pagination info
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);

    // Legacy mode — backward compatible with PlayerCollections / useCollections
    if (page === null) {
      return await handleLegacyGet(request, playerId, searchParams);
    }

    // Paginated mode — new behavior for the collections tab
    return await handlePaginatedGet(playerId, searchParams, page);
  } catch (error) {
    logger.error("Error in collections GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Legacy GET: original behavior without pagination.
 * Kept for backward compatibility with existing consumers.
 */
async function handleLegacyGet(
  request: NextRequest,
  playerId: string,
  searchParams: URLSearchParams
) {
  if (!playerId) {
    return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
  }

  const locale = searchParams.get("locale") || "fr";
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const collections = await fetchCollections(playerId, user?.id, locale);
  return NextResponse.json({ collections });
}

/**
 * Paginated GET: new behavior with sorting, stats, and pagination.
 */
async function handlePaginatedGet(playerId: string, searchParams: URLSearchParams, page: number) {
  // 400 — Invalid UUID format
  if (!PlayerService.validatePlayerId(playerId)) {
    return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
  }

  // 404 — Player not found
  const playerExists = await PlayerService.playerExists(playerId);
  if (!playerExists) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const sort = parseSort(searchParams);

  // Determine ownership
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === playerId;

  // Fetch paginated collections
  const { collections, totalCount } = await PlayerCollectionsServerService.fetchPlayerCollections(
    playerId,
    isOwner,
    sort,
    page
  );

  // Compute pagination
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasNextPage = page < totalPages;

  // Stats only on page 1 (they don't change between pages)
  const stats =
    page === 1
      ? await PlayerCollectionsServerService.fetchPlayerCollectionsStats(playerId, isOwner)
      : { totalCollections: 0, totalGames: 0, largestCollection: null };

  const response: PlayerCollectionsResponse = {
    collections,
    stats,
    pagination: {
      currentPage: page,
      totalPages,
      totalCollections: totalCount,
      hasNextPage,
    },
  };

  return NextResponse.json(response);
}

/**
 * POST /api/players/[id]/collections — Crée une nouvelle collection.
 * Authentification requise. Seul le propriétaire (user.id === playerId) peut créer.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCollectionSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const result = await createCollection(user.id, parsed.data);

    // Evaluate achievements (non-blocking)
    try {
      await AchievementEngine.evaluate(user.id, "collections");
    } catch (error) {
      console.error("Achievement evaluation failed:", error);
    }

    return NextResponse.json({ collection: result }, { status: 201 });
  } catch (error) {
    logger.error("Error in collections POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
