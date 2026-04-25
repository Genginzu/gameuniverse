import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

type RouteParams = { params: Promise<{ id: string }> };

/** PATCH /api/coaching/reviews/[id] — Coach responds to a review */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { response } = await request.json();
    if (!response) return NextResponse.json({ error: "response required" }, { status: 400 });

    // Verify user is the coach
    const { data: review } = await supabase
      .from("coaching_reviews").select("id, coach_id").eq("id", id).single();
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const { data: coach } = await supabase
      .from("coach_profiles").select("id").eq("id", review.coach_id).eq("player_id", user.id).single();
    if (!coach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabase
      .from("coaching_reviews")
      .update({ coach_response: response, coach_responded_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      logger.error("Error responding to review", { error });
      return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in review PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
