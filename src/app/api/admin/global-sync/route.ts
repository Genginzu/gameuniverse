import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/global-sync?page=1&limit=50&search=&filter=all|matched|unmatched
 * Returns paginated igdb_global_sync entries.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(1000, parseInt(searchParams.get("limit") || "1000", 10));
    const search = searchParams.get("search")?.trim() || "";
    const filter = searchParams.get("filter") || "all";
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, cover_image_id, matched_game_id, created_at", {
        count: "exact",
      });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    if (filter === "matched") {
      query = query.not("matched_game_id", "is", null);
    } else if (filter === "unmatched") {
      query = query.is("matched_game_id", null);
    } else if (filter === "unsynced") {
      query = query.eq("is_synced", false);
    } else if (filter === "synced") {
      query = query.eq("is_synced", true);
    } else if (filter === "to_enrich") {
      query = query.eq("is_synced", true).eq("is_enriched", false);
    } else if (filter === "to_colors") {
      query = query.eq("is_synced", true).eq("is_colors_synced", false);
    } else if (filter === "to_metascore") {
      query = query.eq("is_synced", true).eq("is_metascore_synced", false);
    }

    const { data, count, error } = await query
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching global sync entries", { error });
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }

    return NextResponse.json({
      entries: data || [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
