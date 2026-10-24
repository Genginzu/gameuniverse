import { describe, it, expect, vi } from "vitest";

import {
  hasTaxonomyPayload,
  saveGameTaxonomies,
  syncTaxonomies,
  toGameTaxonomies,
} from "@/lib/services/igdbTaxonomies";
import type { IGDBGame } from "@/types/igdb";

const GAME: IGDBGame = {
  id: 1,
  name: "Game",
  slug: "game",
  themes: [{ id: 1, name: "Action", slug: "action" }, 42],
  game_modes: [{ id: 2, name: "Multiplayer", slug: "multiplayer" }],
  player_perspectives: [{ id: 3, name: "Third person", slug: "third-person" }],
  franchise: { id: 10, name: "Main", slug: "main" },
  franchises: [{ id: 10, name: "Main", slug: "main" }, { id: 11, name: "Other", slug: "other" }],
};

describe("toGameTaxonomies", () => {
  it("keeps every taxonomy and merges the main franchise first without duplicates", () => {
    expect(toGameTaxonomies(GAME)).toEqual({
      themes: GAME.themes,
      game_modes: GAME.game_modes,
      player_perspectives: GAME.player_perspectives,
      franchises: [
        { id: 10, name: "Main", slug: "main" },
        { id: 11, name: "Other", slug: "other" },
      ],
    });
  });

  it("returns empty lists for a game without taxonomies", () => {
    expect(toGameTaxonomies({ id: 2, name: "Bare", slug: "bare" })).toEqual({
      themes: [],
      game_modes: [],
      player_perspectives: [],
      franchises: [],
    });
  });
});

describe("hasTaxonomyPayload", () => {
  it.each([
    [{ themes: [1] }, true],
    [{ franchise: 3 }, true],
    [{ name: "x", cover: 1 }, false],
  ])("detects taxonomy keys in %j", (payload, expected) => {
    expect(hasTaxonomyPayload(payload)).toBe(expected);
  });
});

describe("saveGameTaxonomies / syncTaxonomies", () => {
  it("writes through the set_games_taxonomies RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    await syncTaxonomies({ rpc }, "game-uuid", GAME);

    expect(rpc).toHaveBeenCalledWith("set_games_taxonomies", {
      p_items: [{ game_id: "game-uuid", taxonomies: toGameTaxonomies(GAME) }],
    });
  });

  it("skips the call for an empty batch and throws on RPC errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "denied" } });

    await saveGameTaxonomies({ rpc }, []);
    expect(rpc).not.toHaveBeenCalled();

    await expect(
      saveGameTaxonomies({ rpc }, [{ game_id: "g", taxonomies: toGameTaxonomies(GAME) }])
    ).rejects.toThrow("denied");
  });
});
