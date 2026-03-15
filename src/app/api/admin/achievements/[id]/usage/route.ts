import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/achievements/[id]/usage
 * Returns the number of players who have unlocked this achievement.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;
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

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    }

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
  } catch (error) {
    logger.error("Error in admin achievements GET [id]/usage", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
