import { NextRequest, NextResponse } from "next/server";
import { getPlayersList } from "@/lib/services/esportPlayerService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const players = await getPlayersList({ search });
    return NextResponse.json({ players });
  } catch (error) {
    logger.error("Error in esport players API", { error });
    return NextResponse.json({ error: "Failed to fetch esport players" }, { status: 500 });
  }
}
