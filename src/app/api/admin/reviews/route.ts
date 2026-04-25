import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminReviewQuerySchema } from "@/lib/validations/admin-review-query";
import type { AdminReview } from "@/types/admin-reviews";
import { logger } from "@/lib/logger";

/** Row shape returned by the Supabase query (without profiles join) */
interface ReviewListRow {
  id: string;
  user_id: string;
  game_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  games: {
    id: string;
    game_translations: Array<{ title: string }>;
  } | null;
}

interface ProfileInfo {
  username: string | null;
  email: string | null;
}

/** Truncate HTML content to a plain-text excerpt */
function toExcerpt(html: string, maxLength = 100): string {
  const plain = html.replace(/<[^>]*>/g, "").trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength) + "…";
}

function toAdminReview(row: ReviewListRow, profilesMap: Map<string, ProfileInfo>): AdminReview {
  const profile = profilesMap.get(row.user_id);
  return {
    id: row.id,
    rating: row.rating,
    contentExcerpt: toExcerpt(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    playerName: profile?.username ?? null,
    playerEmail: profile?.email ?? null,
    gameTitle: row.games?.game_translations?.[0]?.title ?? "",
    gameId: row.game_id,
  };
}

/**
 * Fetch profiles for a set of user IDs.
 * profiles.id = auth.users.id, so we can query directly by id.
 */
async function fetchProfilesMap(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, ProfileInfo>> {
  const map = new Map<string, ProfileInfo>();
  if (userIds.length === 0) return map;

  const { data } = await supabase.from("profiles").select("id, username, email").in("id", userIds);

  for (const p of data ?? []) {
    map.set(p.id, { username: p.username, email: p.email });
  }

  return map;
}

/**
 * GET /api/admin/reviews — Paginated list with search and sort
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const rawParams: Record<string, string | undefined> = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort_by: searchParams.get("sort_by") ?? undefined,
      sort_order: searchParams.get("sort_order") ?? undefined,
    };

    const queryResult = adminReviewQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // Resolve matching IDs once when searching — used as both count and filter.
    let matchingIds: string[] | undefined;
    let totalCount: number | null;

    if (search?.trim()) {
      const ids = await findMatchingReviewIds(supabase, search.trim());
      if (ids === null) {
        return NextResponse.json({ error: "Failed to search reviews" }, { status: 500 });
      }
      matchingIds = ids;
      totalCount = ids.length;
    } else {
      totalCount = await countAllReviews(supabase);
      if (totalCount === null) {
        return NextResponse.json({ error: "Failed to count reviews" }, { status: 500 });
      }
    }

    const reviews = await fetchReviews(supabase, {
      matchingIds,
      sort_by,
      sort_order,
      offset,
      limit,
    });

    if (reviews === null) {
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    // Fetch profiles separately (no direct FK between game_reviews and profiles)
    const userIds = [...new Set(reviews.map((r) => r.user_id))];
    const profilesMap = await fetchProfilesMap(supabase, userIds);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      reviews: reviews.map((r) => toAdminReview(r, profilesMap)),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error in admin reviews GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

async function countAllReviews(supabase: SupabaseClient): Promise<number | null> {
  const { count, error } = await supabase
    .from("game_reviews")
    .select("id", { count: "estimated", head: true });

  if (error) {
    logger.error("Error counting reviews", { error });
    return null;
  }

  return count ?? 0;
}

interface FetchParams {
  matchingIds: string[] | undefined;
  sort_by: string;
  sort_order: string;
  offset: number;
  limit: number;
}

async function fetchReviews(
  supabase: SupabaseClient,
  params: FetchParams
): Promise<ReviewListRow[] | null> {
  const { matchingIds, sort_by, sort_order, offset, limit } = params;

  if (matchingIds !== undefined && matchingIds.length === 0) return [];

  let query = supabase.from("game_reviews").select(
    `id, user_id, game_id, rating, content, created_at, updated_at,
     games(id, game_translations(title))`
  );

  if (matchingIds) {
    query = query.in("id", matchingIds);
  }

  // Sorting — player_name requires post-sort since it lives in profiles
  const needsClientSort = sort_by === "player_name" || sort_by === "game_title";
  const dbSortColumn = needsClientSort ? "created_at" : sort_by;

  const { data, error } = await query
    .order(dbSortColumn, { ascending: sort_order === "asc" })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error("Error fetching reviews", { error });
    return null;
  }

  const rows = (data ?? []) as unknown as ReviewListRow[];

  if (needsClientSort && sort_by === "game_title") {
    return sortRowsByGameTitle(rows, sort_order);
  }

  // player_name sort is handled after profiles are fetched, in the GET handler
  return rows;
}

/** Find review IDs matching a search term (player name OR game title) */
async function findMatchingReviewIds(
  supabase: SupabaseClient,
  term: string
): Promise<string[] | null> {
  const pattern = `%${term}%`;

  // Profile lookup + game-title search run in parallel — they're independent.
  const [profilesResult, byGameResult] = await Promise.all([
    supabase.from("profiles").select("id").ilike("username", pattern),
    supabase
      .from("game_reviews")
      .select("id, games!inner(game_translations!inner(title))")
      .ilike("games.game_translations.title", pattern),
  ]);

  if (profilesResult.error) {
    logger.error("Error searching profiles", { error: profilesResult.error });
    return null;
  }
  if (byGameResult.error) {
    logger.error("Error searching reviews by game", { error: byGameResult.error });
    return null;
  }

  const matchingUserIds = (profilesResult.data ?? []).map((p) => p.id);
  const ids = new Set<string>();

  for (const r of byGameResult.data ?? []) ids.add(r.id);

  if (matchingUserIds.length > 0) {
    const { data: byPlayer, error: e1 } = await supabase
      .from("game_reviews")
      .select("id")
      .in("user_id", matchingUserIds);

    if (e1) {
      logger.error("Error searching reviews by player", { error: e1 });
      return null;
    }
    for (const r of byPlayer ?? []) ids.add(r.id);
  }

  return [...ids];
}

/** Sort rows by game title (joined field that can't be sorted in Supabase) */
function sortRowsByGameTitle(rows: ReviewListRow[], sortOrder: string): ReviewListRow[] {
  const ascending = sortOrder === "asc";
  return [...rows].sort((a, b) => {
    const valA = (a.games?.game_translations?.[0]?.title ?? "").toLowerCase();
    const valB = (b.games?.game_translations?.[0]?.title ?? "").toLowerCase();
    const cmp = valA.localeCompare(valB);
    return ascending ? cmp : -cmp;
  });
}
