import { NextRequest, NextResponse } from "next/server";
import {
  getCalendarTournaments,
  getCalendarGames,
} from "@/lib/services/esportCalendarService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || undefined;
    const gamesOnly = searchParams.get("games_only") === "true";

    if (gamesOnly) {
      const games = await getCalendarGames();
      return NextResponse.json({ games });
    }

    const tournaments = await getCalendarTournaments({ game });
    return NextResponse.json({ tournaments });
  } catch (error) {
    logger.error("Error in esport calendar API", { error });
    return NextResponse.json(
      { error: "Failed to fetch esport calendar" },
      { status: 500 }
    );
  }
}
