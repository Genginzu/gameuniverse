import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ username: string }> };

/**
 * GET /api/coaching/[username] — Public coach profile by username.
 * Joins profiles → coach_profiles → coach_games (with game info) → coach_pricing.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // 1. Resolve profile by username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // 2. Fetch active coach profile
    const { data: coach, error: coachError } = await untypedTable(supabase, "coach_profiles")
      .select(
        "id, bio, experience, languages, is_verified, average_rating, total_reviews, total_sessions"
      )
      .eq("player_id", profile.id)
      .eq("is_active", true)
      .single();

    if (coachError || !coach) {
      return NextResponse.json({ error: "Active coach profile not found" }, { status: 404 });
    }

    // 3. Fetch coach games with pricing
    const { data: coachGames } = await untypedTable(supabase, "coach_games")
      .select("id, game_id, rank_level, hours_experience, specialties, is_active")
      .eq("coach_id", coach.id)
      .eq("is_active", true);

    // 4. Enrich games with title/slug/cover + pricing
    const games = await Promise.all(
      (coachGames ?? []).map(async (cg: Record<string, unknown>) => {
        // Game info via game_translations
        const { data: game } = await supabase
          .from("games")
          .select("slug, cover_image_url, game_translations(title)")
          .eq("id", cg.game_id as string)
          .single();

        const { data: pricing } = await untypedTable(supabase, "coach_pricing")
          .select("id, session_type, price_amount, price_currency, duration_minutes, is_active")
          .eq("coach_game_id", cg.id as string)
          .eq("is_active", true);

        const translations = game?.game_translations as Array<{ title: string }> | null;

        return {
          id: cg.id,
          gameId: cg.game_id,
          title: translations?.[0]?.title ?? null,
          slug: game?.slug ?? null,
          coverImageUrl: game?.cover_image_url ?? null,
          rankLevel: cg.rank_level,
          hoursExperience: cg.hours_experience,
          specialties: cg.specialties,
          pricing: (pricing ?? []).map((p: Record<string, unknown>) => ({
            id: p.id,
            sessionType: p.session_type,
            priceAmount: p.price_amount,
            priceCurrency: p.price_currency,
            durationMinutes: p.duration_minutes,
          })),
        };
      })
    );

    return NextResponse.json({
      player: {
        username: profile.username,
        avatarUrl: profile.avatar_url,
      },
      coach: {
        id: coach.id,
        bio: coach.bio,
        experience: coach.experience,
        languages: coach.languages,
        averageRating: coach.average_rating,
        totalReviews: coach.total_reviews,
        totalSessions: coach.total_sessions,
        isVerified: coach.is_verified,
      },
      games,
    });
  } catch (error) {
    logger.error("Error in coaching profile GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
