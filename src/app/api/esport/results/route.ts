import { NextRequest, NextResponse } from "next/server";
import { getRecentResults } from "@/lib/services/esportResultsService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || undefined;

    const results = await getRecentResults({ game });
    return NextResponse.json(results);
  } catch (error) {
    logger.error("Error in esport results API", { error });
    return NextResponse.json({ error: "Failed to fetch esport results" }, { status: 500 });
  }
}
