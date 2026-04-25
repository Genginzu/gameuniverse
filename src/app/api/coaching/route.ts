import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { parsePaginationParams } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const FEATURED_LIMIT = 6;

interface CoachRow {
  id: string;
  bio: string | null;
  average_rating: number;
  total_reviews: number;
  total_sessions: number;
  is_verified: boolean;
  created_at: string;
  profiles: { username: string | null; avatar_url: string | null };
  coach_games: Array<{
    games: {
      slug: string;
      cover_image_url: string | null;
      game_translations: Array<{ title: string; language_code: string }>;
    };
    coach_pricing: Array<{ price_amount: number; is_active: boolean }>;
  }>;
}

function mapCoach(row: CoachRow, locale: string) {
  const allPrices =
    row.coach_games?.flatMap(
      (cg) => cg.coach_pricing?.filter((p) => p.is_active).map((p) => Number(p.price_amount)) ?? []
    ) ?? [];
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

  return {
    id: row.id,
    username: row.profiles?.username ?? null,
    displayName: row.profiles?.username ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    bio: row.bio,
    averageRating: Number(row.average_rating),
    totalReviews: row.total_reviews,
    totalSessions: row.total_sessions,
    isVerified: row.is_verified,
    games: (row.coach_games ?? []).map((cg) => {
      const g = cg.games;
      const tr =
        g.game_translations?.find((t) => t.language_code === locale) ?? g.game_translations?.[0];
      return { title: tr?.title ?? "", slug: g.slug, coverImage: g.cover_image_url };
    }),
    minPrice,
  };
}

const SELECT_FIELDS = `
  id, bio, average_rating, total_reviews, total_sessions,
  is_verified, created_at,
  profiles!coach_profiles_player_id_fkey(username, avatar_url),
  coach_games(
    games(slug, cover_image_url, game_translations(title, language_code)),
    coach_pricing(price_amount, is_active)
  )
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const gameSlug = searchParams.get("game")?.trim() || "";
    const minRating = searchParams.get("min_rating");
    const maxPrice = searchParams.get("max_price");
    const sortKey = searchParams.get("sort") || "rating";
    const locale = searchParams.get("locale") || "fr";
    const { page, limit } = parsePaginationParams(searchParams);

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // ── Pre-resolve filters that need joins ──
    // Search by username → get matching player_ids
    let searchPlayerIds: string[] | null = null;
    if (search) {
      const { data: matchingProfiles } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", `%${search}%`);
      searchPlayerIds = matchingProfiles?.map((p) => p.id) ?? [];
      if (searchPlayerIds.length === 0) {
        return NextResponse.json({
          coaches: [],
          pagination: { currentPage: page, totalPages: 0, totalCount: 0, hasNextPage: false },
        });
      }
    }

    // Game slug → get matching coach_ids
    let gameCoachIds: string[] | null = null;
    if (gameSlug) {
      const { data: gameRow } = await supabase
        .from("games")
        .select("id")
        .eq("slug", gameSlug)
        .single();
      if (!gameRow) {
        return NextResponse.json({
          coaches: [],
          pagination: { currentPage: page, totalPages: 0, totalCount: 0, hasNextPage: false },
        });
      }
      const { data: coachGames } = await (supabase as AnySupabase)
        .from("coach_games")
        .select("coach_id")
        .eq("game_id", gameRow.id)
        .eq("is_active", true);
      gameCoachIds = (coachGames?.map((cg: AnySupabase) => cg.coach_id) ?? []) as string[];
      if (gameCoachIds.length === 0) {
        return NextResponse.json({
          coaches: [],
          pagination: { currentPage: page, totalPages: 0, totalCount: 0, hasNextPage: false },
        });
      }
    }

    // ── Apply filters to query ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyFilters(q: any) {
      q = q.eq("is_active", true);
      if (searchPlayerIds) q = q.in("player_id", searchPlayerIds);
      if (gameCoachIds) q = q.in("id", gameCoachIds);
      if (minRating) q = q.gte("average_rating", Number(minRating));
      return q;
    }

    // Count
    const { count: totalCount } = await applyFilters(
      (supabase as AnySupabase).from("coach_profiles").select("id", { count: "exact", head: true })
    );
    const total = totalCount ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Sort config
    const sortMap: Record<string, { col: string; asc: boolean }> = {
      rating: { col: "average_rating", asc: false },
      sessions: { col: "total_sessions", asc: false },
      price: { col: "average_rating", asc: false }, // fallback; price sorted client-side
    };
    const sort = sortMap[sortKey] ?? sortMap.rating;

    // Fetch page
    const { data, error } = await applyFilters(
      (supabase as AnySupabase).from("coach_profiles").select(SELECT_FIELDS)
    )
      .order(sort.col, { ascending: sort.asc })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching coaches", { error });
      return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 });
    }

    let coaches = ((data ?? []) as unknown as CoachRow[]).map((r) => mapCoach(r, locale));

    // max_price and price sort must be applied client-side (computed from nested pricing)
    if (maxPrice) {
      const max = Number(maxPrice);
      coaches = coaches.filter((c) => c.minPrice !== null && c.minPrice <= max);
    }
    if (sortKey === "price") {
      coaches.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    }

    const response: Record<string, unknown> = {
      coaches,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNextPage: page < totalPages,
      },
    };

    // Featured sections on page 1 only
    if (page === 1) {
      const [topRated, newest, popular] = await Promise.all([
        (supabase as AnySupabase)
          .from("coach_profiles")
          .select(SELECT_FIELDS)
          .eq("is_active", true)
          .order("average_rating", { ascending: false })
          .limit(FEATURED_LIMIT),
        (supabase as AnySupabase)
          .from("coach_profiles")
          .select(SELECT_FIELDS)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(FEATURED_LIMIT),
        (supabase as AnySupabase)
          .from("coach_profiles")
          .select(SELECT_FIELDS)
          .eq("is_active", true)
          .order("total_sessions", { ascending: false })
          .limit(FEATURED_LIMIT),
      ]);

      response.featured = {
        topRated: ((topRated.data ?? []) as unknown as CoachRow[]).map((r) => mapCoach(r, locale)),
        newest: ((newest.data ?? []) as unknown as CoachRow[]).map((r) => mapCoach(r, locale)),
        popular: ((popular.data ?? []) as unknown as CoachRow[]).map((r) => mapCoach(r, locale)),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in coaching GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
