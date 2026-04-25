import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

type RouteParams = { params: Promise<{ id: string }> };

/** Verify the pricing entry belongs to the authenticated user. */
async function verifyOwnership(supabase: AnySupabase, pricingId: string, userId: string) {
  const { data } = await supabase
    .from("coach_pricing")
    .select("id, coach_games!inner(coach_id, coach_profiles!inner(player_id))")
    .eq("id", pricingId)
    .eq("coach_games.coach_profiles.player_id", userId)
    .single();
  return data;
}

/**
 * PATCH /api/coaching/pricing/[id]
 * Update a pricing entry. Body: { priceAmount?, durationMinutes?, isActive? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const owned = await verifyOwnership(supabase, id, user.id);

    if (!owned) {
      return NextResponse.json({ error: "Pricing not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.priceAmount !== undefined) updates.price_amount = body.priceAmount;
    if (body.durationMinutes !== undefined) updates.duration_minutes = body.durationMinutes;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("coach_pricing")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating coach pricing", { error });
      return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    logger.error("Error in coaching pricing PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/coaching/pricing/[id]
 * Delete a pricing entry.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const owned = await verifyOwnership(supabase, id, user.id);

    if (!owned) {
      return NextResponse.json({ error: "Pricing not found" }, { status: 404 });
    }

    const { error } = await supabase.from("coach_pricing").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting coach pricing", { error });
      return NextResponse.json({ error: "Failed to delete pricing" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in coaching pricing DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
