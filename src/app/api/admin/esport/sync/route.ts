import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { syncAll } from "@/lib/services/pandascoreSyncService";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const game = typeof body.game === "string" ? body.game : undefined;

    const results = await syncAll(game);
    return NextResponse.json(results);
  } catch (error) {
    logger.error("Error in admin esport sync POST", { error });
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
