import { NextResponse } from "next/server";
import { getUpcomingMatches, getRunningMatches } from "@/lib/pandascore/client";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const id = parseInt(tournamentId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });
    }

    const [upcoming, running] = await Promise.all([
      getUpcomingMatches({ "filter[tournament_id]": id, per_page: 20, sort: "begin_at" }),
      getRunningMatches({ "filter[tournament_id]": id, per_page: 10 }),
    ]);

    const matches = [...running, ...upcoming]
      .filter((m) => m.opponents.length === 2)
      .map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
        beginAt: m.begin_at,
        game: m.videogame.name,
        opponents: m.opponents.map((o) => ({
          id: o.opponent.id,
          name: o.opponent.name,
          imageUrl: "image_url" in o.opponent ? o.opponent.image_url : null,
        })),
      }));

    return NextResponse.json({ matches });
  } catch (error) {
    logger.error("Error fetching tournament matches", { error });
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
