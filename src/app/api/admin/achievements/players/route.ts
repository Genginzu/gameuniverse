import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { playerAchievementActionSchema } from "@/lib/validations/admin-achievement-form";
import { computeLevel } from "@/lib/services/levelSystem";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/achievements/players?userId=<uuid>
 * Returns the list of achievement_keys unlocked by the player.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid input data", details: [{ message: "userId is required" }] },
        { status: 400 }
      );
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
  } catch (error) {
    logger.error("Error in player achievements GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/achievements/players
 * Assign an achievement to a player: insert player_achievements, add XP, update level.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validation = playerAchievementActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { userId, achievementKey } = validation.data;
    const supabase = await createRouteHandlerClient();

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

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    }

    // 2. Check if player already has this achievement
    const { data: existing } = await supabase
      .from("player_achievements")
      .select("achievement_key")
      .eq("user_id", userId)
      .eq("achievement_key", achievementKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Achievement already assigned" }, { status: 409 });
    }

    // 3. Insert into player_achievements
    const { error: insertError } = await supabase.from("player_achievements").insert({
      user_id: userId,
      achievement_key: achievementKey,
      unlocked_at: new Date().toISOString(),
    });

    if (insertError) {
      // Handle race condition (unique constraint)
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Achievement already assigned" }, { status: 409 });
      }
      logger.error("Error inserting player achievement", { error: insertError, userId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // 4. Upsert player_xp: add xp_value
    const xpValue = achievement.xp_value;
    await upsertPlayerXp(supabase, userId, xpValue, "add");

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error("Error in player achievements POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/achievements/players
 * Revoke an achievement from a player: remove player_achievements, subtract XP, update level.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validation = playerAchievementActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { userId, achievementKey } = validation.data;
    const supabase = await createRouteHandlerClient();

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

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    }

    // 2. Check if player has this achievement
    const { data: existing } = await supabase
      .from("player_achievements")
      .select("achievement_key")
      .eq("user_id", userId)
      .eq("achievement_key", achievementKey)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Achievement not assigned to player" }, { status: 404 });
    }

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
  } catch (error) {
    logger.error("Error in player achievements DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- Helper ---

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

/**
 * Add or subtract XP from player_xp, creating the row if needed.
 * After updating xp_total, recalculates the level on the profiles table.
 */
async function upsertPlayerXp(
  supabase: SupabaseClient,
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
