import { describe, it, expect } from "vitest";
import {
  transformIgdbToDlcExtensionRow,
  collectDlcExtensionIds,
  gameTypeToDlcCategory,
} from "@/lib/utils/dlcExtensionUtils";
import type { IGDBDlcExtension, IGDBGame } from "@/types/igdb";

describe("transformIgdbToDlcExtensionRow", () => {
  const baseExtension: IGDBDlcExtension = {
    id: 12345,
    name: "Blood and Wine",
    slug: "blood-and-wine",
    summary: "A great expansion",
    game_type: 2,
    first_release_date: 1464739200, // 2016-06-01
    cover: { image_id: "co1abc" },
  };

  it("transforms a complete IGDB extension into a database row", () => {
    const row = transformIgdbToDlcExtensionRow(baseExtension, "game-uuid-123", "expansion", 1);

    expect(row).toEqual({
      game_id: "game-uuid-123",
      igdb_id: 12345,
      name: "Blood and Wine",
      slug: "blood-and-wine",
      summary: "A great expansion",
      category: "expansion",
      cover_image_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1abc.jpg",
      release_date: "2016-06-01",
      display_order: 1,
    });
  });

  it("uses game_type when available, ignoring sourceCategory", () => {
    const row = transformIgdbToDlcExtensionRow(
      { ...baseExtension, game_type: 1 },
      "game-uuid",
      "bundle",
      0
    );
    expect(row.category).toBe("dlc");
  });

  it("falls back to sourceCategory when game_type is undefined", () => {
    const noGameType: IGDBDlcExtension = {
      id: 99,
      name: "No Type",
      slug: "no-type",
    };
    const row = transformIgdbToDlcExtensionRow(noGameType, "gid", "expansion", 0);
    expect(row.category).toBe("expansion");
  });

  it("returns null cover_image_url when no cover is provided", () => {
    const noCover: IGDBDlcExtension = {
      id: 1,
      name: "No Cover DLC",
      slug: "no-cover",
    };
    const row = transformIgdbToDlcExtensionRow(noCover, "gid", "dlc", 0);
    expect(row.cover_image_url).toBeNull();
  });

  it("returns null release_date when no timestamp is provided", () => {
    const noDate: IGDBDlcExtension = {
      id: 2,
      name: "No Date DLC",
      slug: "no-date",
    };
    const row = transformIgdbToDlcExtensionRow(noDate, "gid", "dlc", 0);
    expect(row.release_date).toBeNull();
  });

  it("returns null summary when summary is undefined", () => {
    const noSummary: IGDBDlcExtension = {
      id: 3,
      name: "No Summary",
      slug: "no-summary",
    };
    const row = transformIgdbToDlcExtensionRow(noSummary, "gid", "dlc", 0);
    expect(row.summary).toBeNull();
  });
});

describe("collectDlcExtensionIds", () => {
  it("collects IDs from all three source fields", () => {
    const game: IGDBGame = {
      id: 1,
      name: "Test Game",
      slug: "test-game",
      dlcs: [10, 11],
      expansions: [20],
      bundles: [30, 31, 32],
    };

    const result = collectDlcExtensionIds(game);

    expect(result).toEqual([
      { id: 10, sourceCategory: "dlc" },
      { id: 11, sourceCategory: "dlc" },
      { id: 20, sourceCategory: "expansion" },
      { id: 30, sourceCategory: "bundle" },
      { id: 31, sourceCategory: "bundle" },
      { id: 32, sourceCategory: "bundle" },
    ]);
  });

  it("returns empty array when no DLC fields are present", () => {
    const game: IGDBGame = { id: 1, name: "Empty", slug: "empty" };
    expect(collectDlcExtensionIds(game)).toEqual([]);
  });

  it("handles partial fields (only expansions)", () => {
    const game: IGDBGame = {
      id: 1,
      name: "Partial",
      slug: "partial",
      expansions: [50],
    };
    expect(collectDlcExtensionIds(game)).toEqual([{ id: 50, sourceCategory: "expansion" }]);
  });
});

describe("gameTypeToDlcCategory", () => {
  it("maps known IGDB game_type values to categories", () => {
    expect(gameTypeToDlcCategory(1)).toBe("dlc");
    expect(gameTypeToDlcCategory(2)).toBe("expansion");
    expect(gameTypeToDlcCategory(3)).toBe("bundle");
    expect(gameTypeToDlcCategory(5)).toBe("mod");
    expect(gameTypeToDlcCategory(6)).toBe("episode");
    expect(gameTypeToDlcCategory(7)).toBe("season");
    expect(gameTypeToDlcCategory(8)).toBe("remake");
    expect(gameTypeToDlcCategory(9)).toBe("remaster");
    expect(gameTypeToDlcCategory(10)).toBe("expanded_game");
    expect(gameTypeToDlcCategory(11)).toBe("port");
    expect(gameTypeToDlcCategory(12)).toBe("fork");
    expect(gameTypeToDlcCategory(13)).toBe("pack");
    expect(gameTypeToDlcCategory(14)).toBe("update");
  });

  it("returns dlc as fallback for unknown game_type", () => {
    expect(gameTypeToDlcCategory(99)).toBe("dlc");
  });

  it("returns dlc when game_type is undefined", () => {
    expect(gameTypeToDlcCategory(undefined)).toBe("dlc");
  });
});
