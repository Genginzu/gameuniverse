import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Parameter 'month' is required (format: YYYY-MM)" },
        { status: 400 }
      );
    }

    const startDate = `${month}-01T00:00:00Z`;
    const [year, m] = month.split("-").map(Number);
    const endDate = new Date(Date.UTC(year, m, 1)).toISOString();

    const supabase = getSupabaseAdmin();

    const { data: matches, error } = await supabase
      .from("esport_matches" as UntypedFrom)
      .select(
        "id, pandascore_id, name, status, begin_at, game, opponent1_id, opponent2_id, opponent1_score, opponent2_score, winner_id, tournament_id"
      )
      .gte("begin_at", startDate)
      .lt("begin_at", endDate)
      .order("begin_at", { ascending: true });

    if (error) throw error;

    // Collect team IDs to fetch names
    const teamIds = new Set<string>();
    for (const match of matches ?? []) {
      if (match.opponent1_id) teamIds.add(match.opponent1_id);
      if (match.opponent2_id) teamIds.add(match.opponent2_id);
    }

    let teamsMap: Record<string, { name: string; acronym: string | null; image_url: string | null; pandascoreId: number | null }> = {};
    if (teamIds.size > 0) {
      const { data: teams } = await supabase
        .from("esport_teams" as UntypedFrom)
        .select("id, name, acronym, image_url, pandascore_id")
        .in("id", [...teamIds]);

      if (teams) {
        teamsMap = Object.fromEntries(
          teams.map((t: Record<string, unknown>) => [
            t.id as string,
            { name: t.name as string, acronym: t.acronym as string | null, image_url: t.image_url as string | null, pandascoreId: t.pandascore_id as number | null },
          ])
        );
      }
    }

    const formattedMatches = (matches ?? []).map((m: Record<string, unknown>) => ({
      id: m.id,
      pandascoreId: m.pandascore_id,
      name: m.name,
      status: m.status,
      beginAt: m.begin_at,
      game: m.game,
      tournamentId: m.tournament_id,
      opponent1: m.opponent1_id ? teamsMap[m.opponent1_id as string] ?? null : null,
      opponent2: m.opponent2_id ? teamsMap[m.opponent2_id as string] ?? null : null,
      opponent1Score: m.opponent1_score ?? null,
      opponent2Score: m.opponent2_score ?? null,
      winnerId: m.winner_id,
    }));

    return NextResponse.json({ matches: formattedMatches });
  } catch (error) {
    logger.error("Error in esport calendar matches API", { error });
    return NextResponse.json({ error: "Failed to fetch calendar matches" }, { status: 500 });
  }
}
