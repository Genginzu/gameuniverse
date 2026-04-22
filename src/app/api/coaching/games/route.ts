import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { CoachGame } from "@/types/coaching";

interface CoachGameRow {
  id: string;
  coach_id: string;
  game_id: string;
  rank_level: string | null;
  hours_experience: number;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

function mapRow(row: CoachGameRow): CoachGame {
  return {
    id: row.id,
    coachId: row.coach_id,
    gameId: row.game_id,
    rankLevel: row.rank_level,
    hoursExperience: row.hours_experience,
    specialties: row.specialties,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("player_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
    }

    const { data: rows, error } = await supabase
      .from("coach_games")
      .select("*")
      .eq("coach_id", profile.id);

    if (error) {
      logger.error("Error fetching coach games", { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ games: (rows || []).map(mapRow) });
  } catch (error) {
    logger.error("Error in coaching games GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("player_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Coach profile required" }, { status: 400 });
    }

    const body = await request.json();
    const { data: row, error } = await supabase
      .from("coach_games")
      .insert({
        coach_id: profile.id,
        game_id: body.gameId,
        rank_level: body.rankLevel ?? null,
        hours_experience: body.hoursExperience ?? 0,
        specialties: body.specialties ?? [],
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Error creating coach game", { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ game: mapRow(row) }, { status: 201 });
  } catch (error) {
    logger.error("Error in coaching games POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
