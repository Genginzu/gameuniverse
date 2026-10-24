import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const coachGameUpdateSchema = z.looseObject({
  rankLevel: z.unknown().optional(),
  hoursExperience: z.unknown().optional(),
  specialties: z.unknown().optional(),
  isActive: z.unknown().optional(),
});

export const PATCH = defineRoute(
  { auth: "required", rateLimit: "coachingProfile", body: coachGameUpdateSchema },
  async ({ params, body }) => {
    const supabase = await createRouteHandlerClient();
    const { gameId } = params;

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
      .maybeSingle();

    if (error) {
      logger.error("Error updating coach game", { error, gameId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    // RLS only lets the owning coach update the row: no row = not found / not yours.
    if (!row) throw notFound("Not found");

    return NextResponse.json({ game: row });
  }
);

export const DELETE = defineRoute({ auth: "required" }, async ({ params }) => {
  const supabase = await createRouteHandlerClient();
  const { gameId } = params;

  const { data: deleted, error } = await (supabase as AnySupabase)
    .from("coach_games")
    .delete()
    .eq("id", gameId)
    .select("id");

  if (error) {
    logger.error("Error deleting coach game", { error, gameId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) throw notFound("Not found");

  return NextResponse.json({ success: true });
});
