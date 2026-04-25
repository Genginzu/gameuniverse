import { NextRequest, NextResponse } from "next/server";
import { getTeamsList } from "@/lib/services/esportTeamService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const teams = await getTeamsList({ search });
    return NextResponse.json({ teams });
  } catch (error) {
    logger.error("Error in esport teams API", { error });
    return NextResponse.json({ error: "Failed to fetch esport teams" }, { status: 500 });
  }
}
