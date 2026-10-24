import { NextResponse } from "next/server";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { validatePlayerId } from "@/lib/utils/statsFormatters";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";
import { defineRoute, forbidden, notFound, validationError } from "@/lib/api/route";

const VALID_GOAL_TYPES = [
  "games_to_complete",
  "play_time_hours",
  "reviews_to_write",
  "collections_to_create",
] as const;

// Field values are checked in the handlers so the dedicated 400/404 messages stay unchanged.
const createGoalSchema = z.object({
  goal_type: z.any().optional(),
  target_value: z.any().optional(),
  deadline: z.any().optional(),
});

const updateGoalSchema = z.object({
  id: z.any().optional(),
  target_value: z.any().optional(),
  deadline: z.any().optional(),
});

/** Verify the caller owns the player profile. Returns the user id and a Supabase client. */
async function authorizeOwner(user: User, playerId: string) {
  if (!validatePlayerId(playerId)) {
    throw validationError(undefined, "Format d'identifiant invalide");
  }

  if (user.id !== playerId) {
    throw forbidden("Non autorisé");
  }

  const supabase = await createRouteHandlerClient();
  return { playerId, userId: user.id, supabase };
}

/** POST — Create a new personal goal */
export const POST = defineRoute(
  { auth: "required", rateLimit: "goal", body: createGoalSchema },
  async ({ user, params, body }) => {
    const { userId, supabase } = await authorizeOwner(user, params.id);

    const { goal_type, target_value, deadline } = body;

    // Validate goal_type
    if (!VALID_GOAL_TYPES.includes(goal_type)) {
      throw validationError(undefined, "Type d'objectif invalide");
    }

    // Validate target_value
    if (typeof target_value !== "number" || target_value <= 0) {
      throw validationError(undefined, "Valeur cible invalide");
    }

    const { data, error } = await untypedTable(supabase, "player_goals")
      .insert({
        user_id: userId,
        goal_type,
        target_value,
        deadline: deadline ?? null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating goal", { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  }
);

/** PUT — Update an existing goal */
export const PUT = defineRoute(
  { auth: "required", body: updateGoalSchema },
  async ({ user, params, body }) => {
    const { userId, supabase } = await authorizeOwner(user, params.id);

    const { id, target_value, deadline } = body;

    if (!id) {
      throw notFound("Objectif non trouvé");
    }

    // Validate target_value if provided
    if (target_value !== undefined && (typeof target_value !== "number" || target_value <= 0)) {
      throw validationError(undefined, "Valeur cible invalide");
    }

    // Check goal exists and belongs to user
    const { data: existing, error: fetchError } = await untypedTable(supabase, "player_goals")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      throw notFound("Objectif non trouvé");
    }

    // Build update payload
    const updates: Record<string, unknown> = {};
    if (target_value !== undefined) updates.target_value = target_value;
    if (deadline !== undefined) updates.deadline = deadline;

    const { data, error } = await untypedTable(supabase, "player_goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating goal", { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(data);
  }
);

/** DELETE — Delete a goal */
export const DELETE = defineRoute({ auth: "required" }, async ({ request, user, params }) => {
  const { userId, supabase } = await authorizeOwner(user, params.id);

  // Try query param first, then body
  const { searchParams } = new URL(request.url);
  let goalId = searchParams.get("id");

  if (!goalId) {
    try {
      const body = await request.json();
      goalId = body.id;
    } catch {
      // No body provided
    }
  }

  if (!goalId) {
    throw notFound("Objectif non trouvé");
  }

  // Check goal exists and belongs to user
  const { data: existing, error: fetchError } = await untypedTable(supabase, "player_goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    throw notFound("Objectif non trouvé");
  }

  const { error } = await untypedTable(supabase, "player_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Error deleting goal", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
});
