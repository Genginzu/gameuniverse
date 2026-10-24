import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute } from "@/lib/api/route";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/translations/refresh-stats
 * Triggers a refresh of the translation_stats_cache table.
 */
export const POST = defineRoute({ auth: "admin" }, async () => {
  // refresh_translation_stats is service_role only (migration 20261018000013).
  const supabase = getSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("refresh_translation_stats");

  if (error) {
    logger.error("Error refreshing translation stats", { error });
    return NextResponse.json({ error: "Failed to refresh stats" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
