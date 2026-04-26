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
import type { PandaScoreListParams } from "@/lib/pandascore/types";
import { logger } from "@/lib/logger";

type Entity = "teams" | "players" | "tournaments" | "matches";

const PAGE_DELAY_MS = 300;

type SendFn = (d: Record<string, unknown>) => void;

async function fetchAllPages<T>(
  fetcher: (p: PandaScoreListParams) => Promise<T[]>,
  entity: string,
  send: SendFn,
  game?: string,
  extra?: Record<string, string | number>,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const p: PandaScoreListParams = { page, per_page: 100, ...extra };
    if (game) p["filter[videogame_title]"] = game;
    try {
      const batch = await fetcher(p);
      all.push(...batch);
      send({ type: "fetch-progress", entity, pages: page, items: all.length });
      if (batch.length < 100) break;
    } catch (error) {
      logger.warn("fetchAllPages stopped early", { entity, page, error });
      send({ type: "fetch-progress", entity, pages: page, items: all.length, partial: true });
      break;
    }
    page++;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }
  return all;
}

async function resolveId(table: string, pandaId?: number | null) {
  if (!pandaId) return null;
  const { data } = await getSupabaseAdmin()
    .from(table)
    .select("id")
    .eq("pandascore_id", pandaId)
    .single();
  return data?.id ?? null;
}

/**
 * POST /api/admin/esport/import
 * SSE stream: syncs teams → players → tournaments → matches from PandaScore.
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
      const send = (d: Record<string, unknown>) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`));

      const supabase = getSupabaseAdmin();
      const start = Date.now();
      const counts: Record<string, { synced: number; errors: number }> = {
        teams: { synced: 0, errors: 0 }, players: { synced: 0, errors: 0 },
        tournaments: { synced: 0, errors: 0 }, matches: { synced: 0, errors: 0 },
      };

      // Create log entry
      const { data: log } = await supabase
        .from("pandascore_sync_logs")
        .insert({ trigger: "manual", status: "running" })
        .select("id")
        .single();
      const logId = log?.id;

      try {
        if (entities.includes("teams")) {
          send({ type: "phase", entity: "teams", status: "fetching" });
          const teams = await fetchAllPages(getTeams, "teams", send, game);
          send({ type: "phase", entity: "teams", status: "syncing", total: teams.length });
          let synced = 0;
          for (const t of teams) {
            const { error } = await supabase.from("esport_teams").upsert(
              {
                pandascore_id: t.id, name: t.name, slug: t.slug,
                acronym: t.acronym, image_url: t.image_url, location: t.location,
                game: t.current_videogame?.name ?? null,
              },
              { onConflict: "pandascore_id" }
            );
            synced++;
            if (error) logger.warn("esport import team error", { id: t.id, error });
            send({ type: "progress", entity: "teams", done: synced, total: teams.length, name: t.name });
          }
          send({ type: "phase", entity: "teams", status: "done", synced });
          counts.teams.synced = synced;
        }

        if (entities.includes("players")) {
          send({ type: "phase", entity: "players", status: "fetching" });
          const players = await fetchAllPages(getPlayers, "players", send, game);
          send({ type: "phase", entity: "players", status: "syncing", total: players.length });
          let synced = 0;
          for (const p of players) {
            const teamId = await resolveId("esport_teams", p.current_team?.id);
            const { error } = await supabase.from("esport_players").upsert(
              {
                pandascore_id: p.id, name: p.name, slug: p.slug,
                first_name: p.first_name, last_name: p.last_name,
                nationality: p.nationality, image_url: p.image_url,
                role: p.role, team_id: teamId,
                game: p.current_videogame?.name ?? null,
              },
              { onConflict: "pandascore_id" }
            );
            synced++;
            if (error) logger.warn("esport import player error", { id: p.id, error });
            send({ type: "progress", entity: "players", done: synced, total: players.length, name: p.name });
          }
          send({ type: "phase", entity: "players", status: "done", synced });
          counts.players.synced = synced;
        }

        if (entities.includes("tournaments")) {
          send({ type: "phase", entity: "tournaments", status: "fetching" });
          const [running, upcoming] = await Promise.all([
            fetchAllPages(getRunningTournaments, "tournaments", send, game),
            fetchAllPages(getUpcomingTournaments, "tournaments", send, game),
          ]);
          const tournaments = [...running, ...upcoming];
          send({ type: "phase", entity: "tournaments", status: "syncing", total: tournaments.length });
          let synced = 0;
          for (const t of tournaments) {
            const { error } = await supabase.from("esport_tournaments").upsert(
              {
                pandascore_id: t.id, name: t.name, slug: t.slug,
                begin_at: t.begin_at, end_at: t.end_at, prizepool: t.prizepool,
                tier: t.tier, league_name: t.league.name,
                league_image_url: t.league.image_url,
                serie_name: t.serie.name, game: t.videogame.name,
              },
              { onConflict: "pandascore_id" }
            );
            synced++;
            if (error) logger.warn("esport import tournament error", { id: t.id, error });
            send({ type: "progress", entity: "tournaments", done: synced, total: tournaments.length, name: t.name });
          }
          send({ type: "phase", entity: "tournaments", status: "done", synced });
          counts.tournaments.synced = synced;
        }

        if (entities.includes("matches")) {
          send({ type: "phase", entity: "matches", status: "fetching" });
          const [past, running] = await Promise.all([
            fetchAllPages(getPastMatches, "matches", send, game),
            fetchAllPages(getRunningMatches, "matches", send, game),
          ]);
          const matches = [...past, ...running];
          send({ type: "phase", entity: "matches", status: "syncing", total: matches.length });
          let synced = 0;
          for (const m of matches) {
            const [tournamentId, opp1, opp2, winnerId] = await Promise.all([
              resolveId("esport_tournaments", m.tournament_id),
              resolveId("esport_teams", m.opponents[0]?.opponent?.id),
              resolveId("esport_teams", m.opponents[1]?.opponent?.id),
              resolveId("esport_teams", m.winner_id),
            ]);
            const { error } = await supabase.from("esport_matches").upsert(
              {
                pandascore_id: m.id, name: m.name, status: m.status,
                match_type: m.match_type, number_of_games: m.number_of_games,
                begin_at: m.begin_at, end_at: m.end_at,
                tournament_id: tournamentId, opponent1_id: opp1, opponent2_id: opp2,
                opponent1_score: m.results?.[0]?.score ?? null,
                opponent2_score: m.results?.[1]?.score ?? null,
                winner_id: winnerId, game: m.videogame.name,
              },
              { onConflict: "pandascore_id" }
            );
            synced++;
            if (error) logger.warn("esport import match error", { id: m.id, error });
            send({ type: "progress", entity: "matches", done: synced, total: matches.length, name: m.name });
          }
          send({ type: "phase", entity: "matches", status: "done", synced });
          counts.matches.synced = synced;
        }

        send({ type: "complete" });
        if (logId) {
          await supabase.from("pandascore_sync_logs").update({
            status: "completed",
            teams_synced: counts.teams.synced, teams_errors: counts.teams.errors,
            players_synced: counts.players.synced, players_errors: counts.players.errors,
            tournaments_synced: counts.tournaments.synced, tournaments_errors: counts.tournaments.errors,
            matches_synced: counts.matches.synced, matches_errors: counts.matches.errors,
            duration_ms: Date.now() - start, completed_at: new Date().toISOString(),
          }).eq("id", logId);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        send({ type: "error", error: msg });
        logger.error("Esport import stream error", { error });
        if (logId) {
          await supabase.from("pandascore_sync_logs").update({
            status: "failed", error_message: msg,
            duration_ms: Date.now() - start, completed_at: new Date().toISOString(),
          }).eq("id", logId);
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
