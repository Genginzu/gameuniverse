import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import * as adminEsportService from "@/lib/services/adminEsportService";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const search = searchParams.get("search") || undefined;
    const tournamentId = searchParams.get("tournament_id") || undefined;

    const { matches, total } = await adminEsportService.getMatches(page, limit, search, tournamentId);
    return NextResponse.json({ matches, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error("Error in admin esport matches GET", { error });
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.name || !body.status || !body.match_type) {
      return NextResponse.json({ error: "name, status and match_type are required" }, { status: 400 });
    }

    const match = await adminEsportService.upsertMatch(body);
    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    logger.error("Error in admin esport matches POST", { error });
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
