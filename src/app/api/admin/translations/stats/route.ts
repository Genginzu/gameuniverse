import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/translations/stats
 * Reads pre-computed stats from translation_stats_cache table.
 */
export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createRouteHandlerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("translation_stats_cache")
      .select("entity_type, language_code, total, complete, partial, missing, percentage");

    if (error) {
      logger.error("Error reading translation stats cache", { error });
      return NextResponse.json({ error: "Failed to read stats" }, { status: 500 });
    }

    const stats = (data || []).map((row: Record<string, unknown>) => ({
      entityType: row.entity_type,
      language: row.language_code,
      total: row.total,
      complete: row.complete,
      partial: row.partial,
      missing: row.missing,
      percentage: row.percentage,
    }));

    return NextResponse.json(
      { stats },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    logger.error("Error in admin translations stats GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
