import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, forbidden, notFound, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const createReviewSchema = z.looseObject({
  sessionId: z.any().optional(),
  rating: z.any().optional(),
  comment: z.any().optional(),
});

/** GET /api/coaching/reviews?coachId=xxx — Public: get reviews for a coach */
export async function GET(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const coachId = request.nextUrl.searchParams.get("coachId");
    if (!coachId) return NextResponse.json({ error: "coachId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("coaching_reviews")
      .select(
        "id, rating, comment, coach_response, coach_responded_at, created_at, student_id, profiles!coaching_reviews_student_id_fkey(username, avatar_url)"
      )
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching reviews", { error });
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    const reviews = (data || []).map((r: S) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      coachResponse: r.coach_response,
      coachRespondedAt: r.coach_responded_at,
      createdAt: r.created_at,
      student: {
        username: r.profiles?.username ?? null,
        avatarUrl: r.profiles?.avatar_url ?? null,
      },
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    logger.error("Error in reviews GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/coaching/reviews — Create a review for a completed session */
export const POST = defineRoute(
  { auth: "required", rateLimit: "review", writesContent: true, body: createReviewSchema },
  async ({ user, body }) => {
    const supabase: S = await createRouteHandlerClient();

    const { sessionId, rating, comment } = body;
    if (!sessionId || !rating) throw validationError(undefined, "sessionId and rating required");
    if (rating < 1 || rating > 5) throw validationError(undefined, "Rating must be 1-5");

    // Verify session is completed and belongs to user
    const { data: session } = await supabase
      .from("coaching_sessions")
      .select("id, coach_id, student_id, status")
      .eq("id", sessionId)
      .single();

    if (!session) throw notFound("Session not found");
    if (session.student_id !== user.id) throw forbidden("Forbidden");
    if (session.status !== "completed")
      return NextResponse.json({ error: "Session must be completed" }, { status: 400 });

    // Check no existing review
    const { data: existing } = await supabase
      .from("coaching_reviews")
      .select("id")
      .eq("session_id", sessionId)
      .single();
    if (existing) throw conflict("Already reviewed");

    const { data: review, error } = await supabase
      .from("coaching_reviews")
      .insert({
        session_id: sessionId,
        coach_id: session.coach_id,
        student_id: user.id,
        rating,
        comment: comment || null,
      })
      .select("id, rating, comment, created_at")
      .single();

    if (error) {
      logger.error("Error creating review", { error });
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    return NextResponse.json({ review }, { status: 201 });
  }
);
