import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, forbidden, notFound, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const reviewResponseSchema = z.looseObject({ response: z.any().optional() });

/** PATCH /api/coaching/reviews/[id] — Coach responds to a review */
export const PATCH = defineRoute(
  { auth: "required", rateLimit: "comment", writesContent: true, body: reviewResponseSchema },
  async ({ user, params, body }) => {
    const supabase: S = await createRouteHandlerClient();

    const { id } = params;
    const { response } = body;
    if (!response) throw validationError(undefined, "response required");

    // Verify user is the coach
    const { data: review } = await supabase
      .from("coaching_reviews")
      .select("id, coach_id")
      .eq("id", id)
      .single();
    if (!review) throw notFound("Review not found");

    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("id", review.coach_id)
      .eq("player_id", user.id)
      .single();
    if (!coach) throw forbidden("Forbidden");

    const { error } = await supabase
      .from("coaching_reviews")
      .update({ coach_response: response, coach_responded_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      logger.error("Error responding to review", { error });
      return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
);
