import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const pricingUpdateSchema = z.looseObject({
  priceAmount: z.unknown().optional(),
  durationMinutes: z.unknown().optional(),
  isActive: z.unknown().optional(),
});

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
export const PATCH = defineRoute(
  { auth: "required", rateLimit: "coachingProfile", body: pricingUpdateSchema },
  async ({ user, params, body }) => {
    const supabase: AnySupabase = await createRouteHandlerClient();

    const { id } = params;
    const owned = await verifyOwnership(supabase, id, user.id);

    if (!owned) throw notFound("Pricing not found");

    const updates: Record<string, unknown> = {};

    if (body.priceAmount !== undefined) updates.price_amount = body.priceAmount;
    if (body.durationMinutes !== undefined) updates.duration_minutes = body.durationMinutes;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    if (Object.keys(updates).length === 0) {
      throw validationError(undefined, "No fields to update");
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
  }
);

/**
 * DELETE /api/coaching/pricing/[id]
 * Delete a pricing entry.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const supabase: AnySupabase = await createRouteHandlerClient();

  const { id } = params;
  const owned = await verifyOwnership(supabase, id, user.id);

  if (!owned) throw notFound("Pricing not found");

  const { error } = await supabase.from("coach_pricing").delete().eq("id", id);

  if (error) {
    logger.error("Error deleting coach pricing", { error });
    return NextResponse.json({ error: "Failed to delete pricing" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
