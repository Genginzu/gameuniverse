import { describe, it, expect, vi } from "vitest";

import {
  IGDB_METADATA_FIELDS,
  metadataSyncer,
  saveGameMetadata,
  syncAllMetadata,
  toGameMetadata,
} from "@/lib/services/igdbMetadata";
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
  collections: [{ id: 62, name: "The Witcher", slug: "the-witcher" }],
  keywords: [{ id: 98, name: "monsters", slug: "monsters" }],
  game_engines: [{ id: 24, name: "REDengine", slug: "redengine" }],
  websites: [
    { url: "https://store.steampowered.com/app/292030", type: 13, trusted: true },
    { url: "http://www.thewitcher.com", type: 1 },
    { type: 3 },
    7,
  ],
  multiplayer_modes: [{ platform: 6, onlinecoop: true, onlinecoopmax: 4 }, 9],
  total_rating: 92.75,
  total_rating_count: 5529,
};

describe("IGDB_METADATA_FIELDS", () => {
  it("expands every metadata field of /games", () => {
    for (const field of [
      "themes.slug",
      "franchise.name",
      "collections.slug",
      "keywords.name",
      "game_engines.name",
      "websites.url",
      "websites.type",
      "multiplayer_modes.onlinecoopmax",
      "total_rating_count",
    ]) {
      expect(IGDB_METADATA_FIELDS).toContain(field);
    }
  });
});

describe("toGameMetadata", () => {
  it("builds every field, merging the main franchise first and keeping only expanded websites and modes", () => {
    expect(toGameMetadata(GAME)).toEqual({
      themes: GAME.themes,
      game_modes: GAME.game_modes,
      player_perspectives: GAME.player_perspectives,
      franchises: [
        { id: 10, name: "Main", slug: "main" },
        { id: 11, name: "Other", slug: "other" },
      ],
      collections: GAME.collections,
      keywords: GAME.keywords,
      game_engines: GAME.game_engines,
      websites: [
        { url: "https://store.steampowered.com/app/292030", type: 13, trusted: true },
        { url: "http://www.thewitcher.com", type: 1, trusted: false },
      ],
      multiplayer_modes: [{ platform: 6, onlinecoop: true, onlinecoopmax: 4 }],
      rating: { total_rating: 92.75, total_rating_count: 5529 },
    });
  });

  it("only writes the requested fields, clearing what IGDB does not return", () => {
    const bare: IGDBGame = { id: 2, name: "Bare", slug: "bare" };
    expect(toGameMetadata(bare, ["franchises", "igdb_rating"])).toEqual({
      franchises: [],
      collections: [],
      rating: { total_rating: null, total_rating_count: null },
    });
  });
});

describe("saveGameMetadata / syncers", () => {
  it("writes through the set_games_metadata RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    await metadataSyncer("keywords")({ rpc }, "game-1", GAME);

    expect(rpc).toHaveBeenCalledWith("set_games_metadata", {
      p_items: [{ game_id: "game-1", metadata: { keywords: GAME.keywords } }],
    });
  });

  it("writes every field on import", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    await syncAllMetadata({ rpc }, "game-1", GAME);

    expect(rpc.mock.calls[0][1].p_items[0].metadata).toEqual(toGameMetadata(GAME));
  });

  it("skips empty batches and surfaces RPC errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "denied" } });

    await saveGameMetadata({ rpc }, []);
    expect(rpc).not.toHaveBeenCalled();

    await expect(
      saveGameMetadata({ rpc }, [{ game_id: "g", metadata: { themes: [] } }])
    ).rejects.toThrow("Failed to save game metadata: denied");
  });
});
