import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

type RouteContext = { params: Promise<{ gameId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gameId } = await params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (body.rankLevel !== undefined) updates.rank_level = body.rankLevel;
    if (body.hoursExperience !== undefined) updates.hours_experience = body.hoursExperience;
    if (body.specialties !== undefined) updates.specialties = body.specialties;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    const { data: row, error } = await (supabase as AnySupabase)
      .from("coach_games")
      .update(updates)
      .eq("id", gameId)
      .select("*")
      .single();

    if (error) {
      logger.error("Error updating coach game", { error, gameId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ game: row });
  } catch (error) {
    logger.error("Error in coaching games PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gameId } = await params;

    const { error } = await (supabase as AnySupabase).from("coach_games").delete().eq("id", gameId);

    if (error) {
      logger.error("Error deleting coach game", { error, gameId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in coaching games DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
