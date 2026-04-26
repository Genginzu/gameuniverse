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

    const { players, total } = await adminEsportService.getPlayers(page, limit, search);
    return NextResponse.json({ players, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error("Error in admin esport players GET", { error });
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

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const player = await adminEsportService.upsertPlayer(body);
    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    logger.error("Error in admin esport players POST", { error });
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
