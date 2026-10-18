import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const db = createSupabaseQueryMock();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve(db.client),
}));
vi.mock("@/lib/utils/color-extraction", () => ({
  extractColorsFromCover: vi.fn().mockResolvedValue(null),
}));

const { IGDBService } = await import("@/lib/services/igdbService");
const { syncSingleField } = await import("@/lib/services/bulkFieldSync");

const GAME_ID = "00000000-0000-0000-0000-000000000001";
const IGDB_ID = 4242;

describe("syncSingleField", () => {
  beforeEach(() => {
    db.reset();
    vi.spyOn(IGDBService, "getGameDetails").mockResolvedValue(null);
    vi.spyOn(IGDBService, "getTimeToBeat").mockResolvedValue({
      hastily: 3600,
      normally: 36000,
      completely: 72000,
    } as Awaited<ReturnType<typeof IGDBService.getTimeToBeat>>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an unknown bulk alias", async () => {
    const result = await syncSingleField(GAME_ID, IGDB_ID, "cover_image");
    expect(result).toEqual({ success: false, error: "Unknown field: cover_image" });
  });

  it("skips a field protected by an admin override", async () => {
    db.enqueue("game_field_overrides", { data: [{ field_name: "cover_image" }] });

    const result = await syncSingleField(GAME_ID, IGDB_ID, "cover");

    expect(result).toEqual({ success: true, value: null, error: "skipped:override" });
    expect(IGDBService.getGameDetails).not.toHaveBeenCalled();
    expect(db.callsFor("games", "update")).toHaveLength(0);
  });

  it("syncs playtime through the registry and returns the stored value", async () => {
    db.enqueue("game_field_overrides", { data: [] });
    db.enqueue("games", {}, { data: { playtime_normally: 10 } });

    const result = await syncSingleField(GAME_ID, IGDB_ID, "playtime");

    expect(result).toEqual({ success: true, value: 10 });
    expect(db.callsFor("games", "update")[0][0]).toMatchObject({
      playtime_hastily: 1,
      playtime_normally: 10,
      playtime_completely: 20,
    });
  });

  it("returns a null value when the game is missing on IGDB", async () => {
    db.enqueue("game_field_overrides", { data: [] });

    const result = await syncSingleField(GAME_ID, IGDB_ID, "cover");

    expect(result).toEqual({ success: true, value: null });
  });
});
