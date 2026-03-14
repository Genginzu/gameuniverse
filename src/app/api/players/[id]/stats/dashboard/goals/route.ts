import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { validatePlayerId } from "@/lib/utils/statsFormatters";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";

const VALID_GOAL_TYPES = [
  "games_to_complete",
  "play_time_hours",
  "reviews_to_write",
  "collections_to_create",
] as const;

/** Authenticate and verify ownership. Returns user id or error response. */
async function authenticateOwner(params: Promise<{ id: string }>) {
  const { id: playerId } = await params;

  if (!validatePlayerId(playerId)) {
    return {
      error: NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 }),
    };
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  if (user.id !== playerId) {
    return {
      error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }),
    };
  }

  return { playerId, userId: user.id, supabase };
}

/** POST — Create a new personal goal */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateOwner(params);
    if ("error" in auth) return auth.error;
    const { userId, supabase } = auth;

    const body = await request.json();
    const { goal_type, target_value, deadline } = body;

    // Validate goal_type
    if (!VALID_GOAL_TYPES.includes(goal_type)) {
      return NextResponse.json({ error: "Type d'objectif invalide" }, { status: 400 });
    }

    // Validate target_value
    if (typeof target_value !== "number" || target_value <= 0) {
      return NextResponse.json({ error: "Valeur cible invalide" }, { status: 400 });
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
  } catch (error) {
    logger.error("Error in POST goals API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PUT — Update an existing goal */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateOwner(params);
    if ("error" in auth) return auth.error;
    const { userId, supabase } = auth;

    const body = await request.json();
    const { id, target_value, deadline } = body;

    if (!id) {
      return NextResponse.json({ error: "Objectif non trouvé" }, { status: 404 });
    }

    // Validate target_value if provided
    if (target_value !== undefined && (typeof target_value !== "number" || target_value <= 0)) {
      return NextResponse.json({ error: "Valeur cible invalide" }, { status: 400 });
    }

    // Check goal exists and belongs to user
    const { data: existing, error: fetchError } = await untypedTable(supabase, "player_goals")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Objectif non trouvé" }, { status: 404 });
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
  } catch (error) {
    logger.error("Error in PUT goals API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE — Delete a goal */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateOwner(params);
    if ("error" in auth) return auth.error;
    const { userId, supabase } = auth;

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
      return NextResponse.json({ error: "Objectif non trouvé" }, { status: 404 });
    }

    // Check goal exists and belongs to user
    const { data: existing, error: fetchError } = await untypedTable(supabase, "player_goals")
      .select("id")
      .eq("id", goalId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Objectif non trouvé" }, { status: 404 });
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
  } catch (error) {
    logger.error("Error in DELETE goals API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
