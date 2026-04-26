import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { SESSION_TYPES } from "@/types/coaching";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * GET /api/coaching/pricing
 * Get all pricing entries for the current user's coach games.
 */
export async function GET() {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("player_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ pricing: [] });
    }

    const { data, error } = await supabase
      .from("coach_pricing")
      .select(
        "*, coach_games!inner(id, coach_id, game_id, games:game_id(slug, cover_image_url, game_translations(title, language_code)))"
      )
      .eq("coach_games.coach_id", profile.id);

    if (error) {
      logger.error("Error fetching coach pricing", { error });
      return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
    }

    const pricing = (data || []).map((row: AnySupabase) => {
      const game = row.coach_games?.games;
      const title = game?.game_translations?.[0]?.title ?? game?.slug ?? "";
      return {
        id: row.id,
        coachGameId: row.coach_game_id,
        sessionType: row.session_type,
        priceAmount: row.price_amount,
        priceCurrency: row.price_currency,
        durationMinutes: row.duration_minutes,
        isActive: row.is_active,
        createdAt: row.created_at,
        gameTitle: title,
        gameCoverImage: game?.cover_image_url ?? null,
      };
    });

    return NextResponse.json({ pricing });
  } catch (error) {
    logger.error("Error in coaching pricing GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/coaching/pricing
 * Create a new pricing entry. Body: { coachGameId, sessionType, priceAmount, priceCurrency, durationMinutes }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { coachGameId, sessionType, priceAmount, priceCurrency, durationMinutes } = body;

    if (!coachGameId || !sessionType || !priceAmount || !priceCurrency || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!SESSION_TYPES.includes(sessionType)) {
      return NextResponse.json({ error: "Invalid session type" }, { status: 400 });
    }

    // Verify the coach_game belongs to the user
    const { data: coachGame } = await supabase
      .from("coach_games")
      .select("id, coach_id, coach_profiles!inner(player_id)")
      .eq("id", coachGameId)
      .eq("coach_profiles.player_id", user.id)
      .single();

    if (!coachGame) {
      return NextResponse.json({ error: "Coach game not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("coach_pricing")
      .insert({
        coach_game_id: coachGameId,
        session_type: sessionType,
        price_amount: priceAmount,
        price_currency: priceCurrency,
        duration_minutes: durationMinutes,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating coach pricing", { error });
      return NextResponse.json({ error: "Failed to create pricing" }, { status: 500 });
    }

    return NextResponse.json(
      {
        pricing: {
          id: data.id,
          coachGameId: data.coach_game_id,
          sessionType: data.session_type,
          priceAmount: data.price_amount,
          priceCurrency: data.price_currency,
          durationMinutes: data.duration_minutes,
          isActive: data.is_active,
          createdAt: data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in coaching pricing POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
