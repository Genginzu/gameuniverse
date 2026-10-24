import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { conflict, defineRoute, notFound, validationError } from "@/lib/api/route";
import { playerAchievementActionSchema } from "@/lib/validations/admin-achievement-form";
import { computeLevel } from "@/lib/services/levelSystem";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/achievements/players?userId=<uuid>
 * Returns the list of achievement_keys unlocked by the player.
 */
export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    throw validationError([{ message: "userId is required" }], "Invalid input data");
  }

  const supabase = await createRouteHandlerClient();

  const { data: rows, error } = await supabase
    .from("player_achievements")
    .select("achievement_key")
    .eq("user_id", userId);

  if (error) {
    logger.error("Error fetching player achievements", { error, userId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const achievements = (rows ?? []).map((r) => r.achievement_key);

  return NextResponse.json({ achievements });
});

/**
 * POST /api/admin/achievements/players
 * Assign an achievement to a player: insert player_achievements, add XP, update level.
 */
export const POST = defineRoute(
  { auth: "admin", body: playerAchievementActionSchema },
  async ({ body }) => {
    const { userId, achievementKey } = body;
    // Admin writes to player_achievements / player_xp / profiles are server-only
    // (issue #372): use the service-role client, authz already done above.
    const supabase = getSupabaseAdmin();

    // 1. Look up achievement in catalog to get xp_value
    const { data: achievement, error: catalogError } = await supabase
      .from("achievement_catalog")
      .select("xp_value")
      .eq("key", achievementKey)
      .maybeSingle();

    if (catalogError) {
      logger.error("Error looking up achievement", { error: catalogError, achievementKey });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!achievement) throw notFound("Achievement not found");

    // 2. Check if player already has this achievement
    const { data: existing } = await supabase
      .from("player_achievements")
      .select("achievement_key")
      .eq("user_id", userId)
      .eq("achievement_key", achievementKey)
      .maybeSingle();

    if (existing) throw conflict("Achievement already assigned");

    // 3. Insert into player_achievements
    const { error: insertError } = await supabase.from("player_achievements").insert({
      user_id: userId,
      achievement_key: achievementKey,
      unlocked_at: new Date().toISOString(),
    });

    if (insertError) {
      // Handle race condition (unique constraint)
      if (insertError.code === "23505") throw conflict("Achievement already assigned");
      logger.error("Error inserting player achievement", { error: insertError, userId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // 4. Upsert player_xp: add xp_value
    const xpValue = achievement.xp_value;
    await upsertPlayerXp(supabase, userId, xpValue, "add");

    return NextResponse.json({ success: true }, { status: 201 });
  }
);

/**
 * DELETE /api/admin/achievements/players
 * Revoke an achievement from a player: remove player_achievements, subtract XP, update level.
 */
export const DELETE = defineRoute(
  { auth: "admin", body: playerAchievementActionSchema },
  async ({ body }) => {
    const { userId, achievementKey } = body;
    // Server-only writes (issue #372): service-role client, authz done above.
    const supabase = getSupabaseAdmin();

    // 1. Look up achievement in catalog to get xp_value
    const { data: achievement, error: catalogError } = await supabase
      .from("achievement_catalog")
      .select("xp_value")
      .eq("key", achievementKey)
      .maybeSingle();

    if (catalogError) {
      logger.error("Error looking up achievement for revoke", { error: catalogError });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!achievement) throw notFound("Achievement not found");

    // 2. Check if player has this achievement
    const { data: existing } = await supabase
      .from("player_achievements")
      .select("achievement_key")
      .eq("user_id", userId)
      .eq("achievement_key", achievementKey)
      .maybeSingle();

    if (!existing) throw notFound("Achievement not assigned to player");

    // 3. Delete from player_achievements
    const { error: deleteError } = await supabase
      .from("player_achievements")
      .delete()
      .eq("user_id", userId)
      .eq("achievement_key", achievementKey);

    if (deleteError) {
      logger.error("Error deleting player achievement", { error: deleteError, userId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // 4. Update player_xp: subtract xp_value (clamp to 0)
    const xpValue = achievement.xp_value;
    await upsertPlayerXp(supabase, userId, xpValue, "subtract");

    return NextResponse.json({ success: true });
  }
);

// --- Helper ---

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

/**
 * Add or subtract XP from player_xp, creating the row if needed.
 * After updating xp_total, recalculates the level on the profiles table.
 * Uses the service-role client (server-only XP writes, issue #372).
 */
async function upsertPlayerXp(
  supabase: AdminClient,
  userId: string,
  xpValue: number,
  operation: "add" | "subtract"
) {
  // Fetch current XP (may not exist yet)
  const { data: xpRow } = await supabase
    .from("player_xp")
    .select("xp_total")
    .eq("user_id", userId)
    .maybeSingle();

  const currentXp = xpRow?.xp_total ?? 0;
  const newXpTotal = operation === "add" ? currentXp + xpValue : Math.max(0, currentXp - xpValue);

  // Upsert player_xp row
  const { error: xpError } = await supabase.from("player_xp").upsert(
    {
      user_id: userId,
      xp_total: newXpTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (xpError) {
    logger.error("Failed to upsert player XP", { error: xpError, userId });
    return;
  }

  // Recalculate level and update profile
  const newLevel = computeLevel(newXpTotal);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ level: newLevel })
    .eq("id", userId);

  if (profileError) {
    logger.error("Failed to update profile level", { error: profileError, userId });
  }
}
