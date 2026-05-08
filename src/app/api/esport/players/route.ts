import { NextRequest, NextResponse } from "next/server";
import { getPlayersGames, getPlayersList } from "@/lib/services/esportPlayerService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Lightweight branch used by the filter chips on the listing page.
    if (searchParams.get("games_only") === "true") {
      const games = await getPlayersGames();
      return NextResponse.json({ games });
    }

    const search = searchParams.get("search") || undefined;
    const game = searchParams.get("game") || undefined;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const page = pageParam ? parseInt(pageParam, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (page !== undefined && (isNaN(page) || page < 1)) {
      return NextResponse.json({ error: "Invalid 'page' parameter" }, { status: 400 });
    }
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return NextResponse.json({ error: "Invalid 'limit' parameter" }, { status: 400 });
    }

    const listing = await getPlayersList({ search, game, page, limit });
    return NextResponse.json(listing);
  } catch (error) {
    logger.error("Error in esport players API", { error });
    return NextResponse.json({ error: "Failed to fetch esport players" }, { status: 500 });
  }
}
