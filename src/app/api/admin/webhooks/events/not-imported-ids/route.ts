import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { untypedTable } from "@/lib/utils/untypedTable";

/**
 * GET /api/admin/webhooks/events/not-imported-ids?limit=20
 * Returns distinct igdb_ids of game webhook events with no local game_id.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const supabase = await createRouteHandlerClient();

    // Paginate to collect all distinct igdb_ids with no game_id
    const seen = new Set<number>();
    const uniqueIds: number[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore && uniqueIds.length < limit) {
      const { data, error } = await untypedTable(supabase, "igdb_webhook_events")
        .select("igdb_id")
        .eq("entity_type", "games")
        .is("game_id", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of data) {
        if (!seen.has(row.igdb_id)) {
          seen.add(row.igdb_id);
          uniqueIds.push(row.igdb_id);
          if (uniqueIds.length >= limit) break;
        }
      }

      offset += PAGE_SIZE;
      if (data.length < PAGE_SIZE) hasMore = false;
    }

    return NextResponse.json({ igdbIds: uniqueIds, total: seen.size });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
