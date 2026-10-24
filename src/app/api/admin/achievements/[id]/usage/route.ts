import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound } from "@/lib/api/route";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/achievements/[id]/usage
 * Returns the number of players who have unlocked this achievement.
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id } = params;
  const supabase = await createRouteHandlerClient();

  // Fetch the achievement to get its key
  const { data: achievement, error: fetchError } = await supabase
    .from("achievement_catalog")
    .select("key")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    logger.error("Error fetching achievement for usage check", { error: fetchError, id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!achievement) throw notFound("Achievement not found");

  // Count player_achievements rows with this key
  const { count, error: countError } = await supabase
    .from("player_achievements")
    .select("*", { count: "exact", head: true })
    .eq("achievement_key", achievement.key);

  if (countError) {
    logger.error("Error counting achievement usage", { error: countError, id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ usageCount: count ?? 0 });
});
