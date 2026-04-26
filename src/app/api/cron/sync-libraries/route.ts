import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { syncSteamLibrary } from "@/lib/services/steamLibrarySync";
import { syncXboxLibrary } from "@/lib/services/xboxLibrarySync";

const MAX_USERS_PER_RUN = 50;

interface SyncOutcome {
  playerId: string;
  platform: "steam" | "xbox";
  ok: boolean;
  matched?: number;
  total?: number;
  error?: string;
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  return bearer === secret || request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: rows, error } = await supabase
    .from("player_linked_platforms")
    .select("player_id, platform, external_id")
    .in("platform", ["steam", "xbox"])
    .limit(MAX_USERS_PER_RUN);

  if (error) {
    logger.error("cron sync-libraries select failed", { error });
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const outcomes: SyncOutcome[] = [];

  for (const row of rows ?? []) {
    const platform = row.platform as "steam" | "xbox";
    try {
      if (platform === "steam") {
        if (!row.external_id) {
          outcomes.push({ playerId: row.player_id, platform, ok: false, error: "missing steamid" });
          continue;
        }
        const r = await syncSteamLibrary(supabase, row.player_id, row.external_id);
        outcomes.push({
          playerId: row.player_id,
          platform,
          ok: true,
          matched: r.matched,
          total: r.total,
        });
      } else {
        const r = await syncXboxLibrary(supabase, row.player_id);
        outcomes.push({
          playerId: row.player_id,
          platform,
          ok: true,
          matched: r.matched,
          total: r.total,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "sync failed";
      logger.error("cron sync-libraries user failed", {
        playerId: row.player_id,
        platform,
        message,
      });
      outcomes.push({ playerId: row.player_id, platform, ok: false, error: message });
    }
  }

  return NextResponse.json({
    processed: outcomes.length,
    succeeded: outcomes.filter((o) => o.ok).length,
    failed: outcomes.filter((o) => !o.ok).length,
    outcomes,
  });
}
