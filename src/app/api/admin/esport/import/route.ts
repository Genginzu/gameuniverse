import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getTeams,
  getPlayers,
  getRunningTournaments,
  getUpcomingTournaments,
  getPastMatches,
  getRunningMatches,
} from "@/lib/pandascore/client";
import {
  bulkUpsert,
  cleanupStaleSyncLogs,
  fetchAllPages,
  preloadIdMap,
  DEFAULT_MAX_PAGES,
} from "@/lib/services/pandascore-sync-helpers";
import { logger } from "@/lib/logger";

type Entity = "teams" | "players" | "tournaments" | "matches";
type SendFn = (d: Record<string, unknown>) => void;

/**
 * Cap the function runtime to 5 min on Vercel Pro/Enterprise (defaults to 60s
 * on Hobby — the sync should still finish well under either).
 */
export const maxDuration = 300;

/**
 * POST /api/admin/esport/import
 * Server-Sent Events stream that syncs teams → players → tournaments → matches
 * from PandaScore in bulk batches.
 *
 * Body: { game?: string, entities?: Entity[] }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const game = typeof body.game === "string" ? body.game : undefined;
  const entities: Entity[] = Array.isArray(body.entities)
    ? body.entities
    : ["teams", "players", "tournaments", "matches"];

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send: SendFn = (d) => controller.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`));

      // Best-effort cleanup of orphan running logs before starting.
      await cleanupStaleSyncLogs();

      const supabase = getSupabaseAdmin();
      const start = Date.now();
      const counts: Record<Entity, { synced: number; errors: number }> = {
        teams: { synced: 0, errors: 0 },
        players: { synced: 0, errors: 0 },
        tournaments: { synced: 0, errors: 0 },
        matches: { synced: 0, errors: 0 },
      };

      const { data: log } = await supabase
        .from("pandascore_sync_logs")
        .insert({ trigger: "manual", status: "running" })
        .select("id")
        .single();
      const logId = log?.id;

      try {
        if (entities.includes("teams")) {
          counts.teams = await syncTeamsStream(send, game);
        }
        if (entities.includes("players")) {
          counts.players = await syncPlayersStream(send, game);
        }
        if (entities.includes("tournaments")) {
          counts.tournaments = await syncTournamentsStream(send, game);
        }
        if (entities.includes("matches")) {
          counts.matches = await syncMatchesStream(send, game);
        }

        send({ type: "complete" });

        if (logId) {
          await supabase.from("pandascore_sync_logs").update({
            status: "completed",
            teams_synced: counts.teams.synced, teams_errors: counts.teams.errors,
            players_synced: counts.players.synced, players_errors: counts.players.errors,
            tournaments_synced: counts.tournaments.synced, tournaments_errors: counts.tournaments.errors,
            matches_synced: counts.matches.synced, matches_errors: counts.matches.errors,
            duration_ms: Date.now() - start,
            completed_at: new Date().toISOString(),
          }).eq("id", logId);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        send({ type: "error", error: msg });
        logger.error("Esport import stream error", { error });
        if (logId) {
          await supabase.from("pandascore_sync_logs").update({
            status: "failed", error_message: msg,
            duration_ms: Date.now() - start,
            completed_at: new Date().toISOString(),
          }).eq("id", logId);
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// -- Per-entity sync helpers --

async function syncTeamsStream(send: SendFn, game?: string) {
  send({ type: "phase", entity: "teams", status: "fetching" });
  const teams = await fetchAllPages(getTeams, {
    game,
    maxPages: DEFAULT_MAX_PAGES,
    label: "teams",
    onPage: (info) => send({ type: "fetch-progress", entity: "teams", pages: info.page, items: info.total }),
  });

  send({ type: "phase", entity: "teams", status: "syncing", total: teams.length });
  const rows = teams.map((t) => ({
    pandascore_id: t.id, name: t.name, slug: t.slug,
    acronym: t.acronym, image_url: t.image_url, location: t.location,
    game: t.current_videogame?.name ?? null,
  }));
  const result = await bulkUpsert("esport_teams", rows, "pandascore_id", {
    nameField: "name",
    onProgress: (p) => send({ type: "progress", entity: "teams", done: p.synced, total: p.total, name: p.lastName }),
  });
  send({ type: "phase", entity: "teams", status: "done", synced: result.synced });
  return result;
}

async function syncPlayersStream(send: SendFn, game?: string) {
  send({ type: "phase", entity: "players", status: "fetching" });
  const players = await fetchAllPages(getPlayers, {
    game,
    maxPages: DEFAULT_MAX_PAGES,
    label: "players",
    onPage: (info) => send({ type: "fetch-progress", entity: "players", pages: info.page, items: info.total }),
  });

  // Preload teams to avoid N RTT
  const teamPandaIds = players.map((p) => p.current_team?.id).filter((id): id is number => typeof id === "number");
  const teamMap = await preloadIdMap("esport_teams", teamPandaIds);

  send({ type: "phase", entity: "players", status: "syncing", total: players.length });
  const rows = players.map((p) => ({
    pandascore_id: p.id, name: p.name, slug: p.slug,
    first_name: p.first_name, last_name: p.last_name,
    nationality: p.nationality, image_url: p.image_url,
    role: p.role,
    team_id: p.current_team?.id ? teamMap.get(p.current_team.id) ?? null : null,
    game: p.current_videogame?.name ?? null,
  }));
  const result = await bulkUpsert("esport_players", rows, "pandascore_id", {
    nameField: "name",
    onProgress: (p) => send({ type: "progress", entity: "players", done: p.synced, total: p.total, name: p.lastName }),
  });
  send({ type: "phase", entity: "players", status: "done", synced: result.synced });
  return result;
}

async function syncTournamentsStream(send: SendFn, game?: string) {
  send({ type: "phase", entity: "tournaments", status: "fetching" });
  const [running, upcoming] = await Promise.all([
    fetchAllPages(getRunningTournaments, {
      game, maxPages: DEFAULT_MAX_PAGES, label: "tournaments-running",
      onPage: (info) => send({ type: "fetch-progress", entity: "tournaments", pages: info.page, items: info.total }),
    }),
    fetchAllPages(getUpcomingTournaments, {
      game, maxPages: DEFAULT_MAX_PAGES, label: "tournaments-upcoming",
      onPage: (info) => send({ type: "fetch-progress", entity: "tournaments", pages: info.page, items: info.total }),
    }),
  ]);
  const tournaments = [...running, ...upcoming];

  send({ type: "phase", entity: "tournaments", status: "syncing", total: tournaments.length });
  const rows = tournaments.map((t) => ({
    pandascore_id: t.id, name: t.name, slug: t.slug,
    begin_at: t.begin_at, end_at: t.end_at, prizepool: t.prizepool,
    tier: t.tier, league_name: t.league.name,
    league_image_url: t.league.image_url,
    serie_name: t.serie.name, game: t.videogame.name,
  }));
  const result = await bulkUpsert("esport_tournaments", rows, "pandascore_id", {
    nameField: "name",
    onProgress: (p) => send({ type: "progress", entity: "tournaments", done: p.synced, total: p.total, name: p.lastName }),
  });
  send({ type: "phase", entity: "tournaments", status: "done", synced: result.synced });
  return result;
}

async function syncMatchesStream(send: SendFn, game?: string) {
  send({ type: "phase", entity: "matches", status: "fetching" });
  const [past, running] = await Promise.all([
    fetchAllPages(getPastMatches, {
      game, maxPages: DEFAULT_MAX_PAGES, label: "matches-past",
      onPage: (info) => send({ type: "fetch-progress", entity: "matches", pages: info.page, items: info.total }),
    }),
    fetchAllPages(getRunningMatches, {
      game, maxPages: DEFAULT_MAX_PAGES, label: "matches-running",
      onPage: (info) => send({ type: "fetch-progress", entity: "matches", pages: info.page, items: info.total }),
    }),
  ]);
  const matches = [...past, ...running];

  // Resolve FKs in two queries
  const tournamentPandaIds = matches.map((m) => m.tournament_id).filter((id): id is number => typeof id === "number");
  const teamPandaIds = matches.flatMap((m) => [
    m.opponents[0]?.opponent?.id,
    m.opponents[1]?.opponent?.id,
    m.winner_id,
  ]).filter((id): id is number => typeof id === "number");

  const [tournamentMap, teamMap] = await Promise.all([
    preloadIdMap("esport_tournaments", tournamentPandaIds),
    preloadIdMap("esport_teams", teamPandaIds),
  ]);

  send({ type: "phase", entity: "matches", status: "syncing", total: matches.length });
  const rows = matches.map((m) => ({
    pandascore_id: m.id, name: m.name, status: m.status,
    match_type: m.match_type, number_of_games: m.number_of_games,
    begin_at: m.begin_at, end_at: m.end_at,
    tournament_id: tournamentMap.get(m.tournament_id) ?? null,
    opponent1_id: m.opponents[0]?.opponent?.id ? teamMap.get(m.opponents[0].opponent.id) ?? null : null,
    opponent2_id: m.opponents[1]?.opponent?.id ? teamMap.get(m.opponents[1].opponent.id) ?? null : null,
    opponent1_score: m.results?.[0]?.score ?? null,
    opponent2_score: m.results?.[1]?.score ?? null,
    winner_id: m.winner_id ? teamMap.get(m.winner_id) ?? null : null,
    game: m.videogame.name,
  }));
  const result = await bulkUpsert("esport_matches", rows, "pandascore_id", {
    nameField: "name",
    onProgress: (p) => send({ type: "progress", entity: "matches", done: p.synced, total: p.total, name: p.lastName }),
  });
  send({ type: "phase", entity: "matches", status: "done", synced: result.synced });
  return result;
}
