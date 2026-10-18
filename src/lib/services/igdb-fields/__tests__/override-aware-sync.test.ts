import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { IGDBService } from "@/lib/services/igdbService";
import { syncTrackedFields } from "@/lib/services/igdb-fields/override-aware-sync";
import type { SyncSupabaseClient } from "@/lib/services/igdb-sync";
import type { IGDBGame } from "@/types/igdb";

const GAME_ID = "00000000-0000-0000-0000-000000000001";
const IGDB_ID = 4242;

const IGDB_GAME: IGDBGame = {
  id: IGDB_ID,
  name: "Test Game",
  slug: "test-game",
  videos: [{ id: 1, video_id: "abc", name: "Trailer" }],
} as IGDBGame;

const db = createSupabaseQueryMock();
const client = db.client as unknown as SyncSupabaseClient;

describe("syncTrackedFields", () => {
  beforeEach(() => {
    db.reset();
    vi.spyOn(IGDBService, "getTimeToBeat").mockResolvedValue({
      hastily: 3600,
      normally: 7200,
      completely: 10800,
    } as Awaited<ReturnType<typeof IGDBService.getTimeToBeat>>);
    vi.spyOn(IGDBService, "getGameDetails").mockResolvedValue(IGDB_GAME);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips overridden fields and syncs the others", async () => {
    db.enqueue("game_field_overrides", { data: [{ field_name: "videos" }] });

    const outcome = await syncTrackedFields(client, {
      gameId: GAME_ID,
      igdbId: IGDB_ID,
      fields: ["videos", "playtime"],
      respectOverrides: true,
      igdbGame: IGDB_GAME,
    });

    expect(outcome).toEqual({
      status: "synced",
      syncedFields: ["playtime"],
      skippedFields: ["videos"],
    });
    expect(db.callsFor("game_videos", "delete")).toHaveLength(0);
    expect(db.callsFor("game_videos", "insert")).toHaveLength(0);
    expect(db.callsFor("games", "update")[0][0]).toMatchObject({
      playtime_hastily: 1,
      playtime_normally: 2,
      playtime_completely: 3,
    });
  });

  it("ignores unknown override names", async () => {
    db.enqueue("game_field_overrides", { data: [{ field_name: "slug" }] });

    const outcome = await syncTrackedFields(client, {
      gameId: GAME_ID,
      igdbId: IGDB_ID,
      fields: ["playtime"],
      respectOverrides: true,
    });

    expect(outcome).toMatchObject({ syncedFields: ["playtime"], skippedFields: [] });
  });

  it("syncs overridden fields when overrides are not respected", async () => {
    const outcome = await syncTrackedFields(client, {
      gameId: GAME_ID,
      igdbId: IGDB_ID,
      fields: ["videos"],
      respectOverrides: false,
      igdbGame: IGDB_GAME,
    });

    expect(outcome).toMatchObject({ syncedFields: ["videos"], skippedFields: [] });
    expect(db.callsFor("game_field_overrides", "select")).toHaveLength(0);
    expect(db.callsFor("game_videos", "delete")).toHaveLength(1);
  });

  it("does not fetch IGDB details when only id-based fields are synced", async () => {
    await syncTrackedFields(client, {
      gameId: GAME_ID,
      igdbId: IGDB_ID,
      fields: ["playtime"],
      respectOverrides: false,
    });

    expect(IGDBService.getGameDetails).not.toHaveBeenCalled();
  });

  it("does not fetch IGDB details when every game-based field is overridden", async () => {
    db.enqueue("game_field_overrides", { data: [{ field_name: "videos" }] });

    const outcome = await syncTrackedFields(client, {
      gameId: GAME_ID,
      igdbId: IGDB_ID,
      fields: ["videos"],
      respectOverrides: true,
    });

    expect(outcome).toEqual({ status: "synced", syncedFields: [], skippedFields: ["videos"] });
    expect(IGDBService.getGameDetails).not.toHaveBeenCalled();
  });

  it("reports a missing IGDB game without writing anything", async () => {
    vi.mocked(IGDBService.getGameDetails).mockResolvedValue(null);

    const outcome = await syncTrackedFields(client, {
      gameId: GAME_ID,
      igdbId: IGDB_ID,
      fields: ["videos", "playtime"],
      respectOverrides: false,
    });

    expect(outcome.status).toBe("igdb_game_not_found");
    expect(db.callsFor("games", "update")).toHaveLength(0);
    expect(db.callsFor("game_videos", "delete")).toHaveLength(0);
  });

  it("fails closed when overrides cannot be read", async () => {
    db.enqueue("game_field_overrides", { error: { message: "boom" } });

    await expect(
      syncTrackedFields(client, {
        gameId: GAME_ID,
        igdbId: IGDB_ID,
        fields: ["playtime"],
        respectOverrides: true,
      })
    ).rejects.toThrow("Failed to fetch field overrides: boom");
    expect(db.callsFor("games", "update")).toHaveLength(0);
  });
});
