import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

async function requireAdmin(supabase: S) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? user : null;
}

/** GET /api/admin/coaching — List all coaches with stats */
export async function GET(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const admin = await requireAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = request.nextUrl.searchParams.get("status"); // active, suspended, all
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("coach_profiles")
      .select(
        "id, player_id, bio, is_active, is_verified, is_suspended, average_rating, total_reviews, total_sessions, stripe_onboarding_complete, created_at, profiles!coach_profiles_player_id_fkey(username, avatar_url, email)",
        { count: "exact" }
      );

    if (status === "suspended") query = query.eq("is_suspended", true);
    else if (status === "active") query = query.eq("is_active", true).eq("is_suspended", false);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching coaches", { error });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const coaches = (data || []).map((c: S) => ({
      id: c.id,
      playerId: c.player_id,
      bio: c.bio,
      isActive: c.is_active,
      isVerified: c.is_verified,
      isSuspended: c.is_suspended,
      averageRating: c.average_rating,
      totalReviews: c.total_reviews,
      totalSessions: c.total_sessions,
      stripeComplete: c.stripe_onboarding_complete,
      createdAt: c.created_at,
      username: c.profiles?.username,
      avatarUrl: c.profiles?.avatar_url,
      email: c.profiles?.email,
    }));

    return NextResponse.json({ coaches, total: count || 0, page, limit });
  } catch (error) {
    logger.error("Error in admin coaching GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
