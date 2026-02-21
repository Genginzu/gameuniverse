import { describe, it, expect } from "vitest";
import {
  flattenResults,
  computeNextIndex,
  computePrevIndex,
  getResultUrl,
  type FlatSearchItem,
} from "@/lib/utils/global-search-utils";
import type { GlobalSearchResponse } from "@/types/global-search";

// --- flattenResults ---

describe("flattenResults", () => {
  it("returns empty array for null results", () => {
    expect(flattenResults(null)).toEqual([]);
  });

  it("flattens results in order: games → characters → players", () => {
    const response: GlobalSearchResponse = {
      games: [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }],
      characters: [{ id: "c1", slug: "link", name: "Link" }],
      players: [{ id: "p1", username: "player1" }],
      counts: { games: 1, characters: 1, players: 1 },
    };

    const flat = flattenResults(response);
    expect(flat).toHaveLength(3);
    expect(flat[0].type).toBe("game");
    expect(flat[1].type).toBe("character");
    expect(flat[2].type).toBe("player");
  });

  it("skips empty categories", () => {
    const response: GlobalSearchResponse = {
      games: [],
      characters: [{ id: "c1", slug: "link", name: "Link" }],
      players: [],
      counts: { games: 0, characters: 1, players: 0 },
    };

    const flat = flattenResults(response);
    expect(flat).toHaveLength(1);
    expect(flat[0].type).toBe("character");
  });
});

// --- computeNextIndex ---

describe("computeNextIndex", () => {
  it("moves from -1 to 0", () => {
    expect(computeNextIndex(-1, 5)).toBe(0);
  });

  it("increments normally", () => {
    expect(computeNextIndex(2, 5)).toBe(3);
  });

  it("clamps at last index", () => {
    expect(computeNextIndex(4, 5)).toBe(4);
  });

  it("returns -1 when no results", () => {
    expect(computeNextIndex(-1, 0)).toBe(-1);
  });
});

// --- computePrevIndex ---

describe("computePrevIndex", () => {
  it("moves from 3 to 2", () => {
    expect(computePrevIndex(3)).toBe(2);
  });

  it("clamps at -1", () => {
    expect(computePrevIndex(0)).toBe(-1);
  });

  it("stays at -1 when already there", () => {
    expect(computePrevIndex(-1)).toBe(-1);
  });
});

// --- getResultUrl ---

describe("getResultUrl", () => {
  it("returns correct URL for local game (no locale prefix)", () => {
    const item: FlatSearchItem = {
      type: "game",
      id: "g1",
      slug: "zelda",
      title: "Zelda",
      source: "local",
    };
    expect(getResultUrl(item)).toBe("/games/zelda");
  });

  it("returns null for IGDB game", () => {
    const item: FlatSearchItem = {
      type: "game",
      id: "g2",
      slug: "mario",
      title: "Mario",
      source: "igdb",
    };
    expect(getResultUrl(item)).toBeNull();
  });

  it("returns correct URL for character (no locale prefix)", () => {
    const item: FlatSearchItem = {
      type: "character",
      id: "c1",
      slug: "link",
      name: "Link",
    };
    expect(getResultUrl(item)).toBe("/characters/link");
  });

  it("returns correct URL for player (no locale prefix)", () => {
    const item: FlatSearchItem = {
      type: "player",
      id: "p1",
      username: "player1",
    };
    expect(getResultUrl(item)).toBe("/players/p1");
  });
});
