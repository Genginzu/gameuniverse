import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { reviewSchema } from "@/lib/validations/review";
import type { AdminReviewDetail } from "@/types/admin-reviews";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ id: string }> };

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
  userId: string
): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).single();
  return data?.username ?? null;
}

/**
 * GET /api/admin/reviews/[id] — Full review detail for editing
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("game_reviews")
      .select(DETAIL_SELECT)
      .eq("id", reviewId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }
      logger.error("Error fetching review", { error });
      return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const row = data as unknown as ReviewDetailRow;
    const playerName = await fetchPlayerName(supabase, row.user_id);

    return NextResponse.json(toAdminReviewDetail(row, playerName));
  } catch (error) {
    logger.error("Error in admin review GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/reviews/[id] — Update a review
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = reviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { rating, content, positivePoints, negativePoints } = validationResult.data;
    const supabase = await createRouteHandlerClient();

    // Check existence
    const { data: existing, error: checkError } = await supabase
      .from("game_reviews")
      .select("id")
      .eq("id", reviewId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

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
  } catch (error) {
    logger.error("Error in admin review PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reviews/[id] — Delete a review
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Check existence
    const { data: existing, error: checkError } = await supabase
      .from("game_reviews")
      .select("id")
      .eq("id", reviewId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("game_reviews").delete().eq("id", reviewId);

    if (deleteError) {
      logger.error("Error deleting review", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin review DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
