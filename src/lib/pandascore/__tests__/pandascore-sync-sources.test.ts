import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeEsportDb, match, player } from "@/test-helpers/pandascore-fixtures";

const client = vi.hoisted(() => ({
  getPastMatches: vi.fn(),
  getPlayers: vi.fn(),
  getRunningMatches: vi.fn(),
  getRunningTournaments: vi.fn(),
  getTeams: vi.fn(),
  getUpcomingTournaments: vi.fn(),
  getMatchById: vi.fn(),
  getPlayerById: vi.fn(),
  getTeamById: vi.fn(),
  getTournamentById: vi.fn(),
}));

const callbacks = vi.hoisted(() => ({
  reconcilePlayerTeamHistory: vi.fn(),
  resolvePredictionsForMatch: vi.fn(),
}));

vi.mock("../../../../supabase/functions/_shared/pandascore/client.ts", () => client);
vi.mock("../../../../supabase/functions/_shared/pandascore/vercel-callbacks.ts", () => callbacks);

import { processEntityPage } from "../../../../supabase/functions/pandascore-full-sync/handlers/process-page.ts";
import {
  syncMatchesByIds,
  syncPlayersByIds,
} from "../../../../supabase/functions/pandascore-incremental/handlers/sync-by-ids.ts";
import {
  MAX_ERROR_DETAILS,
  SyncErrorCollector,
} from "../../../../supabase/functions/_shared/pandascore/helpers.ts";
import { PandaScoreApiError } from "../../../../supabase/functions/_shared/pandascore/sync-run/failure.ts";

const IDS = {
  esport_teams: { 10: "team-uuid-10", 20: "team-uuid-20" },
  esport_players: { 1: "player-uuid-1", 2: "player-uuid-2" },
};

function supabaseWith(fake: ReturnType<typeof createFakeEsportDb>) {
  return fake.db as unknown as Parameters<typeof processEntityPage>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  callbacks.reconcilePlayerTeamHistory.mockResolvedValue(undefined);
  callbacks.resolvePredictionsForMatch.mockResolvedValue(undefined);
});

describe("full-sync page source", () => {
  it("ingests a players page and reconciles team history", async () => {
    client.getPlayers.mockResolvedValue([player(1, 10), player(2, 20)]);
    const fake = createFakeEsportDb({ ids: IDS });

    const result = await processEntityPage(supabaseWith(fake), "players", 3, "LoL", new SyncErrorCollector());

    expect(client.getPlayers).toHaveBeenCalledWith({ page: 3, per_page: 100, "filter[videogame_title]": "LoL" });
    expect(result).toEqual({ pageItems: 2, failure: null, synced: 2, errors: 0 });
    expect(callbacks.reconcilePlayerTeamHistory).toHaveBeenCalledWith([
      { playerLocalId: "player-uuid-1", newTeamLocalId: "team-uuid-10" },
      { playerLocalId: "player-uuid-2", newTeamLocalId: "team-uuid-20" },
    ]);
  });

  it("settles predictions for finished past matches", async () => {
    client.getPastMatches.mockResolvedValue([match(7, { status: "finished", winner_id: 10 })]);
    const fake = createFakeEsportDb({ ids: IDS });

    await processEntityPage(supabaseWith(fake), "matches_past", 1, null, new SyncErrorCollector());

    expect(callbacks.resolvePredictionsForMatch).toHaveBeenCalledWith(7, 10);
    expect(fake.rowsFor("esport_matches")[0]).toMatchObject({ pandascore_id: 7, winner_id: "team-uuid-10" });
  });

  it("flags a failed fetch without touching the database", async () => {
    client.getTeams.mockRejectedValue(new PandaScoreApiError(503, "Service Unavailable"));
    const fake = createFakeEsportDb();
    const errors = new SyncErrorCollector();

    const result = await processEntityPage(supabaseWith(fake), "teams", 2, null, errors);

    expect(result).toEqual({ pageItems: 0, failure: "transient", synced: 0, errors: 0 });
    expect(fake.upserts).toEqual({});
    expect(errors.toJSON()[0]).toMatchObject({ type: "team", phase: "fetch" });
  });

  it("reports a rate limit even once the error ledger is capped", async () => {
    client.getTeams.mockRejectedValue(new PandaScoreApiError(429, "Too Many Requests"));
    const errors = new SyncErrorCollector();
    for (let i = 0; i < MAX_ERROR_DETAILS + 5; i++) {
      errors.add({ type: "team", id: i, phase: "upsert", error: "boom" });
    }

    const result = await processEntityPage(supabaseWith(createFakeEsportDb()), "teams", 9, null, errors);

    expect(result.failure).toBe("rate_limited");
    expect(errors.droppedCount).toBe(6);
  });
});

describe("incremental id source", () => {
  it("ingests players by id, counts failed fetches and reconciles history", async () => {
    client.getPlayerById.mockImplementation(async (id: number) => {
      if (id === 3) {
        throw new Error("not found");
      }
      return player(id, 10);
    });
    const fake = createFakeEsportDb({ ids: IDS });
    const errors = new SyncErrorCollector();

    const result = await syncPlayersByIds(supabaseWith(fake), [1, 2, 3], errors);

    expect(result).toEqual({ synced: 2, errors: 1 });
    expect(errors.toJSON()[0]).toMatchObject({ type: "player", id: 3, phase: "fetch" });
    expect(callbacks.reconcilePlayerTeamHistory).toHaveBeenCalledTimes(1);
  });

  it("settles predictions for finished matches and records callback failures", async () => {
    client.getMatchById.mockImplementation(async (id: number) => match(id, { status: "finished", winner_id: 20 }));
    callbacks.resolvePredictionsForMatch.mockRejectedValue(new Error("/api/internal responded 500"));
    const fake = createFakeEsportDb({ ids: IDS });
    const errors = new SyncErrorCollector();

    const result = await syncMatchesByIds(supabaseWith(fake), [4], errors);

    expect(result).toEqual({ synced: 1, errors: 0 });
    expect(callbacks.resolvePredictionsForMatch).toHaveBeenCalledWith(4, 20);
    expect(errors.toJSON()).toEqual([
      expect.objectContaining({ type: "match", id: 4, phase: "side_effect" }),
    ]);
  });

  it("returns early for an empty id list", async () => {
    const fake = createFakeEsportDb();

    await expect(syncPlayersByIds(supabaseWith(fake), [], new SyncErrorCollector())).resolves.toEqual({
      synced: 0,
      errors: 0,
    });
    expect(client.getPlayerById).not.toHaveBeenCalled();
  });
});
