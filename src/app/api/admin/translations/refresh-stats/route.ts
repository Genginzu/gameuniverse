import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/translations/refresh-stats
 * Triggers a refresh of the translation_stats_cache table.
 */
export async function POST() {
  try {
    await requireAdmin();

    const supabase = await createRouteHandlerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("refresh_translation_stats");

    if (error) {
      logger.error("Error refreshing translation stats", { error });
      return NextResponse.json({ error: "Failed to refresh stats" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in refresh-stats POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
