import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { reviewSchema } from "@/lib/validations/review";
import type { AdminReviewDetail } from "@/types/admin-reviews";
import { logger } from "@/lib/logger";

/** Row shape returned by the detail query (without profiles join) */
interface ReviewDetailRow {
  id: string;
  user_id: string;
  game_id: string;
  rating: number;
  content: string;
  positive_points: string[];
  negative_points: string[];
  created_at: string;
  updated_at: string;
  games: { game_translations: Array<{ title: string }> } | null;
}

function toAdminReviewDetail(row: ReviewDetailRow, playerName: string | null): AdminReviewDetail {
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
    playerName,
    gameTitle: row.games?.game_translations?.[0]?.title ?? "",
  };
}

// No profiles join — fetch separately to avoid missing FK issue
const DETAIL_SELECT = `
  id, user_id, game_id, rating, content,
  positive_points, negative_points,
  created_at, updated_at,
  games(game_translations(title))
`;

/** Fetch username from profiles table by user_id */
async function fetchPlayerName(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string | null
): Promise<string | null> {
  // Anonymised review: the author deleted their account.
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).single();
  return data?.username ?? null;
}

/**
 * GET /api/admin/reviews/[id] — Full review detail for editing
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: reviewId } = params;

  if (!reviewId) throw validationError(undefined, "Review ID is required");

  const supabase = await createRouteHandlerClient();

  const { data, error } = await supabase
    .from("game_reviews")
    .select(DETAIL_SELECT)
    .eq("id", reviewId)
    .single();

  if (error) {
    if (error.code === "PGRST116") throw notFound("Review not found");
    logger.error("Error fetching review", { error });
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }

  if (!data) throw notFound("Review not found");

  const row = data as unknown as ReviewDetailRow;
  const playerName = await fetchPlayerName(supabase, row.user_id);

  return NextResponse.json(toAdminReviewDetail(row, playerName));
});

/**
 * PUT /api/admin/reviews/[id] — Update a review
 */
export const PUT = defineRoute(
  { auth: "admin", body: reviewSchema },
  async ({ params, body }) => {
    const { id: reviewId } = params;

    if (!reviewId) throw validationError(undefined, "Review ID is required");

    const { rating, content, positivePoints, negativePoints } = body;
    const supabase = await createRouteHandlerClient();

    // Check existence
    const { data: existing, error: checkError } = await supabase
      .from("game_reviews")
      .select("id")
      .eq("id", reviewId)
      .single();

    if (checkError || !existing) throw notFound("Review not found");

    // Update
    const { error: updateError } = await supabase
      .from("game_reviews")
      .update({
        rating,
        content,
        positive_points: positivePoints,
        negative_points: negativePoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) {
      logger.error("Error updating review", { error: updateError });
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }

    // Fetch updated review
    const { data: updated, error: fetchError } = await supabase
      .from("game_reviews")
      .select(DETAIL_SELECT)
      .eq("id", reviewId)
      .single();

    if (fetchError || !updated) {
      logger.error("Error fetching updated review", { error: fetchError });
      return NextResponse.json({ error: "Failed to fetch updated review" }, { status: 500 });
    }

    const row = updated as unknown as ReviewDetailRow;
    const playerName = await fetchPlayerName(supabase, row.user_id);

    return NextResponse.json(toAdminReviewDetail(row, playerName));
  }
);

/**
 * DELETE /api/admin/reviews/[id] — Delete a review
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: reviewId } = params;

  if (!reviewId) throw validationError(undefined, "Review ID is required");

  const supabase = await createRouteHandlerClient();

  // Check existence
  const { data: existing, error: checkError } = await supabase
    .from("game_reviews")
    .select("id")
    .eq("id", reviewId)
    .single();

  if (checkError || !existing) throw notFound("Review not found");

  const { error: deleteError } = await supabase.from("game_reviews").delete().eq("id", reviewId);

  if (deleteError) {
    logger.error("Error deleting review", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
