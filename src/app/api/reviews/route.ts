import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { reviewSchema } from "@/lib/validations/review";
import type { Review, ReviewsResponse, VoteType } from "@/types/review";
import {
  fetchVoteCountsMap,
  fetchUserVotesMap,
  enrichReviewsWithVotes,
} from "@/lib/utils/reviewVoteQueries";
import { logger } from "@/lib/logger";

interface ReviewRow {
  id: string;
  user_id: string;
  game_id: string;
  rating: number;
  content: string;
  positive_points: string[];
  negative_points: string[];
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

/**
 * Compute the average rating from a list of reviews.
 * Returns null if the list is empty.
 */
export function computeAverageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}

/**
 * Sort reviews by helpful vote count descending, then by date descending as tiebreaker.
 * The current user's review (if any) is always placed first.
 */
export function sortReviewsByHelpfulVotes<
  T extends { userId: string; voteCounts: { helpful: number }; createdAt: string },
>(reviews: T[], currentUserId: string | null): T[] {
  return [...reviews].sort((a, b) => {
    // Current user's review always first
    if (currentUserId) {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
    }
    // Then by helpful votes descending
    const diff = b.voteCounts.helpful - a.voteCounts.helpful;
    if (diff !== 0) return diff;
    // Tiebreaker: most recent first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Transform a database row into a Review with profile info.
 */
function toReview(row: ReviewRow, profilesMap: Map<string, ProfileRow>): Review {
  const profile = profilesMap.get(row.user_id);
  return {
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    rating: row.rating,
    content: row.content,
    positivePoints: row.positive_points ?? [],
    negativePoints: row.negative_points ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    playerName: profile?.username ?? null,
    playerAvatar: profile?.avatar_url ?? null,
  };
}

/**
 * Fetch profiles for a list of user IDs.
 * Returns a Map keyed by user_id for O(1) lookup.
 */
async function fetchProfilesMap(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userIds: string[]
): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  if (error || !data) return map;

  for (const row of data as ProfileRow[]) {
    map.set(row.id, row);
  }
  return map;
}

/**
 * GET /api/reviews?gameId=<uuid>
 *
 * Returns all reviews for a game, sorted by date descending,
 * with player profiles, vote counts, user vote, average rating,
 * and whether the current user has reviewed.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const gameId = request.nextUrl.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json({ error: "gameId query parameter is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch reviews ordered by created_at descending
    const { data: rows, error: reviewsError } = await supabase
      .from("game_reviews")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      if (reviewsError.code === "PGRST205") {
        const emptyResponse: ReviewsResponse = {
          reviews: [],
          averageRating: null,
          totalCount: 0,
          userHasReviewed: false,
        };
        return NextResponse.json(emptyResponse);
      }
      logger.error("Error fetching reviews", { error: reviewsError });
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    const reviewRows = (rows ?? []) as ReviewRow[];
    const reviewIds = reviewRows.map((r) => r.id);

    // Fetch profiles and vote data in parallel
    const userIds = [...new Set(reviewRows.map((r) => r.user_id))];
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [profilesMap, voteCountsMap, userVotesMap] = await Promise.all([
      fetchProfilesMap(supabase, userIds),
      fetchVoteCountsMap(supabase, reviewIds),
      user
        ? fetchUserVotesMap(supabase, user.id, reviewIds)
        : Promise.resolve(new Map<string, VoteType>()),
    ]);

    // Transform rows to Review objects, then enrich with vote data
    const reviews: Review[] = reviewRows.map((row) => toReview(row, profilesMap));
    const reviewsWithVotes = enrichReviewsWithVotes(reviews, voteCountsMap, userVotesMap);

    const userHasReviewed = user ? reviews.some((r) => r.userId === user.id) : false;
    const userReview = user ? (reviews.find((r) => r.userId === user.id) ?? null) : null;

    // Sort: user's review first, then by helpful votes descending
    const sortedReviews = sortReviewsByHelpfulVotes(reviewsWithVotes, user?.id ?? null);

    const response: ReviewsResponse = {
      reviews: sortedReviews,
      averageRating: computeAverageRating(reviews),
      totalCount: reviews.length,
      userHasReviewed,
      userReview: userReview ?? undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in reviews GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 *
 * Create a new review for a game. Validates input with reviewSchema.
 * Automatically adds the game to the user's library if not already present.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const { rating, content, positivePoints, negativePoints } = parsed.data;
    const gameId = body.gameId;

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Insert the review
    const { data: review, error: insertError } = await supabase
      .from("game_reviews")
      .insert({
        user_id: user.id,
        game_id: gameId,
        rating,
        content,
        positive_points: positivePoints,
        negative_points: negativePoints,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Vous avez déjà laissé un avis pour ce jeu" },
          { status: 409 }
        );
      }
      logger.error("Error inserting review", { error: insertError });
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    // Add game to library if not already present (non-blocking)
    try {
      await supabase.from("user_library").insert({
        user_id: user.id,
        game_id: gameId,
        status: "owned",
      });
    } catch {
      // Library addition is non-blocking — log and continue
      logger.warn("Could not add game to library (may already exist)");
    }

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    logger.error("Error in reviews POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/reviews
 *
 * Update an existing review. Only the review author can update their review.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
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
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const { rating, content, positivePoints, negativePoints } = parsed.data;
    const gameId = body.gameId;

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    const { data: review, error: updateError } = await supabase
      .from("game_reviews")
      .update({
        rating,
        content,
        positive_points: positivePoints,
        negative_points: negativePoints,
        updated_at: new Date().toISOString(),
      })
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !review) {
      logger.error("Error updating review", { error: updateError });
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    logger.error("Error in reviews PUT", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
