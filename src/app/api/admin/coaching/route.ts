import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { adminAuthErrorStatus, requireAdminUser } from "@/lib/auth-admin";
import { fetchUserEmails } from "@/lib/services/userEmailsServerService";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/**
 * GET /api/admin/coaching — List all coaches with stats.
 * coach_profiles has no admin RLS policy, so the admin check runs first and
 * the query uses the service-role client (issue #385).
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const supabase: S = getSupabaseAdmin();

    const status = request.nextUrl.searchParams.get("status"); // active, suspended, all
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("coach_profiles")
      .select(
        "id, player_id, bio, is_active, is_verified, is_suspended, average_rating, total_reviews, total_sessions, stripe_onboarding_complete, created_at, profiles!coach_profiles_player_id_fkey(username, avatar_url)",
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

    const rows = data || [];
    const coachEmails = await fetchUserEmails(rows.map((c: S) => c.player_id));
    const coaches = rows.map((c: S) => ({
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
      email: coachEmails.get(c.player_id) ?? null,
    }));

    return NextResponse.json({ coaches, total: count || 0, page, limit });
  } catch (error) {
    const authStatus = adminAuthErrorStatus(error);
    if (authStatus) {
      return NextResponse.json({ error: (error as Error).message }, { status: authStatus });
    }
    logger.error("Error in admin coaching GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
