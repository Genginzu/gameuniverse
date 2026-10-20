import { describe, it, expect, vi } from "vitest";
import {
  ingestMatches,
  ingestPlayers,
  ingestTeams,
  ingestTournaments,
  type IngestSideEffects,
} from "../../../../supabase/functions/_shared/pandascore/ingest/index.ts";
import { SyncErrorCollector } from "../../../../supabase/functions/_shared/pandascore/sync-error-collector.ts";
import { createFakeEsportDb, match, player, team, tournament } from "@/test-helpers/pandascore-fixtures";

function createSideEffects(overrides: Partial<IngestSideEffects> = {}): IngestSideEffects {
  return {
    reconcilePlayerTeamHistory: vi.fn().mockResolvedValue(undefined),
    resolvePredictionsForMatch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function setup(options: Parameters<typeof createFakeEsportDb>[0] = {}, sideEffects = createSideEffects()) {
  const fake = createFakeEsportDb(options);
  const errors = new SyncErrorCollector();
  return { ...fake, errors, sideEffects, deps: { db: fake.db, errors, sideEffects } };
}

describe("PandaScore ingest", () => {
  it("upserts mapped teams and tournaments", async () => {
    const { deps, rowsFor } = setup();

    await expect(ingestTeams(deps, [team(1), team(2)])).resolves.toEqual({ synced: 2, errors: 0 });
    await expect(ingestTournaments(deps, [tournament(5)])).resolves.toEqual({ synced: 1, errors: 0 });

    expect(rowsFor("esport_teams").map((r) => r.pandascore_id)).toEqual([1, 2]);
    expect(rowsFor("esport_tournaments")[0]).toMatchObject({ pandascore_id: 5, league_name: "League" });
  });

  it("skips every query for an empty batch", async () => {
    const { deps, upserts, lookups, sideEffects } = setup();

    await expect(ingestPlayers(deps, [])).resolves.toEqual({ synced: 0, errors: 0 });
    await expect(ingestMatches(deps, [])).resolves.toEqual({ synced: 0, errors: 0 });

    expect(upserts).toEqual({});
    expect(lookups).toEqual({});
    expect(sideEffects.reconcilePlayerTeamHistory).not.toHaveBeenCalled();
  });

  it("resolves player team FKs and reconciles team history", async () => {
    const { deps, rowsFor, sideEffects } = setup({
      ids: {
        esport_teams: { 10: "team-uuid-10" },
        esport_players: { 1: "player-uuid-1", 2: "player-uuid-2" },
      },
    });

    const result = await ingestPlayers(deps, [player(1, 10), player(2, null), player(3, 99)]);

    expect(result).toEqual({ synced: 3, errors: 0 });
    expect(rowsFor("esport_players").map((r) => r.team_id)).toEqual(["team-uuid-10", null, null]);
    expect(sideEffects.reconcilePlayerTeamHistory).toHaveBeenCalledWith([
      { playerLocalId: "player-uuid-1", newTeamLocalId: "team-uuid-10" },
      { playerLocalId: "player-uuid-2", newTeamLocalId: null },
    ]);
  });

  it("resolves match FKs and settles only finished matches with a winner", async () => {
    const { deps, rowsFor, sideEffects } = setup({
      ids: {
        esport_tournaments: { 100: "tournament-uuid" },
        esport_teams: { 10: "team-uuid-10", 20: "team-uuid-20" },
      },
    });

    await ingestMatches(deps, [
      match(1, { status: "finished", winner_id: 20 }),
      match(2, { status: "finished", winner_id: null }),
      match(3, { status: "running", winner_id: 10 }),
    ]);

    expect(rowsFor("esport_matches")[0]).toMatchObject({
      pandascore_id: 1,
      tournament_id: "tournament-uuid",
      opponent1_id: "team-uuid-10",
      opponent2_id: "team-uuid-20",
      winner_id: "team-uuid-20",
    });
    expect(sideEffects.resolvePredictionsForMatch).toHaveBeenCalledTimes(1);
    expect(sideEffects.resolvePredictionsForMatch).toHaveBeenCalledWith(1, 20);
  });

  it("records side-effect failures in the collector without failing the batch", async () => {
    const sideEffects = createSideEffects({
      reconcilePlayerTeamHistory: vi.fn().mockRejectedValue(new Error("history down")),
      resolvePredictionsForMatch: vi.fn(async (matchId: number) => {
        if (matchId === 2) {
          throw new Error("settle down");
        }
      }),
    });
    const { deps, errors } = setup({ ids: { esport_players: { 1: "player-uuid-1" } } }, sideEffects);

    await expect(ingestPlayers(deps, [player(1, null)])).resolves.toEqual({ synced: 1, errors: 0 });
    await ingestMatches(deps, [
      match(1, { status: "finished", winner_id: 10 }),
      match(2, { status: "finished", winner_id: 20 }),
    ]);

    expect(errors.toJSON()).toEqual([
      expect.objectContaining({ type: "player", id: null, phase: "side_effect", error: expect.stringContaining("history down") }),
      expect.objectContaining({ type: "match", id: 2, phase: "side_effect", error: expect.stringContaining("settle down") }),
    ]);
  });

  it("records upsert errors per row and counts them", async () => {
    const { deps, errors, upserts } = setup({ upsertErrors: { esport_teams: "constraint violated" } });
    const teams = Array.from({ length: 101 }, (_, i) => team(i + 1));

    await expect(ingestTeams(deps, teams)).resolves.toEqual({ synced: 0, errors: 101 });

    expect(upserts.esport_teams.map((batch) => batch.length)).toEqual([100, 1]);
    expect(errors.count).toBe(101);
    expect(errors.toJSON()[0]).toEqual({ type: "team", id: 1, phase: "upsert", error: "constraint violated" });
  });
});
