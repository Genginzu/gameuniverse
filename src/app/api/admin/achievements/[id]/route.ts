import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, notFound } from "@/lib/api/route";
import { adminAchievementFormSchema } from "@/lib/validations/admin-achievement-form";
import { logger } from "@/lib/logger";
import type { AdminAchievement } from "@/types/admin-achievements";

/** Raw row shape from the achievement_catalog table */
interface AchievementRow {
  id: string;
  key: string;
  category: string;
  tier: string;
  threshold: number;
  xp_value: number;
  icon: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  sort_order: number;
}

const ACHIEVEMENT_COLUMNS =
  "id, key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order";

/** Map a DB row to the AdminAchievement camelCase shape */
function toAdminAchievement(row: AchievementRow): AdminAchievement {
  return {
    id: row.id,
    key: row.key,
    category: row.category as AdminAchievement["category"],
    tier: row.tier as AdminAchievement["tier"],
    threshold: row.threshold,
    xpValue: row.xp_value,
    icon: row.icon,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    descriptionFr: row.description_fr,
    descriptionEn: row.description_en,
    sortOrder: row.sort_order,
  };
}

/**
 * GET /api/admin/achievements/[id] — Fetch a single achievement by UUID
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id } = params;
  const supabase = await createRouteHandlerClient();

  const { data: row, error } = await supabase
    .from("achievement_catalog")
    .select(ACHIEVEMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logger.error("Error fetching achievement by id", { error, id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!row) throw notFound("Achievement not found");

  return NextResponse.json({ achievement: toAdminAchievement(row as AchievementRow) });
});

/**
 * PUT /api/admin/achievements/[id] — Update an existing achievement
 */
export const PUT = defineRoute(
  { auth: "admin", body: adminAchievementFormSchema },
  async ({ params, body: data }) => {
    const { id } = params;
    const supabase = await createRouteHandlerClient();

    // Check that the achievement exists
    const { data: existing, error: fetchError } = await supabase
      .from("achievement_catalog")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      logger.error("Error checking achievement existence", { error: fetchError, id });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!existing) throw notFound("Achievement not found");

    // Check key uniqueness excluding current ID
    const { data: duplicate } = await supabase
      .from("achievement_catalog")
      .select("id")
      .eq("key", data.key)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) throw conflict("Achievement key already exists");

    const { data: updated, error: updateError } = await supabase
      .from("achievement_catalog")
      .update({
        key: data.key,
        category: data.category,
        tier: data.tier,
        threshold: data.threshold,
        xp_value: data.xpValue,
        icon: data.icon,
        name_fr: data.nameFr,
        name_en: data.nameEn,
        description_fr: data.descriptionFr,
        description_en: data.descriptionEn,
        sort_order: data.sortOrder,
      })
      .eq("id", id)
      .select(ACHIEVEMENT_COLUMNS)
      .single();

    if (updateError) {
      // Handle race condition on key uniqueness
      if (updateError.code === "23505") throw conflict("Achievement key already exists");

      logger.error("Error updating achievement", { error: updateError, id });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ achievement: toAdminAchievement(updated as AchievementRow) });
  }
);

/**
 * DELETE /api/admin/achievements/[id] — Delete an achievement
 * Supports ?force=true to bypass usage check
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ request, params }) => {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const supabase = await createRouteHandlerClient();

  // Fetch the achievement to get its key (needed for usage check)
  const { data: achievement, error: fetchError } = await supabase
    .from("achievement_catalog")
    .select("id, key")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    logger.error("Error fetching achievement for deletion", { error: fetchError, id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!achievement) throw notFound("Achievement not found");

  // Check usage in player_achievements unless force is set
  if (!force) {
    const { count, error: countError } = await supabase
      .from("player_achievements")
      .select("*", { count: "exact", head: true })
      .eq("achievement_key", achievement.key);

    if (countError) {
      logger.error("Error counting achievement usage", { error: countError, id });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const usageCount = count || 0;

    if (usageCount > 0) {
      throw conflict("Achievement in use", { usageCount });
    }
  }

  const { error: deleteError } = await supabase.from("achievement_catalog").delete().eq("id", id);

  if (deleteError) {
    logger.error("Error deleting achievement", { error: deleteError, id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
