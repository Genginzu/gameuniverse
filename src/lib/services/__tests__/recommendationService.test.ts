import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  countLibraryGames,
  getPersonalRecommendations,
  getRecommendationsForGame,
} from "@/lib/services/recommendationService";
import type { RecommendationClient } from "@/lib/services/recommendation/client";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const db = createSupabaseQueryMock();
const rpc = vi.fn();
const client = { ...db.client, rpc } as unknown as RecommendationClient;

function row(gameId: string) {
  return {
    game_id: gameId,
    score: 0.5,
    content_score: 0.4,
    similar_score: 0.6,
    collaborative_score: 0,
    quality_score: 0.7,
  };
}

function enqueueMetadata() {
  db.enqueue("games", {
    data: [
      {
        id: "pick",
        slug: "pick-slug",
        cover_image_url: "cover.jpg",
        metascore: 88,
        game_companies: [
          { role: "publisher", is_primary: true, companies: { name: "Pub" } },
          { role: "developer", is_primary: true, companies: { name: "Studio" } },
        ],
      },
    ],
  });
  db.enqueue("game_translations", {
    data: [
      { game_id: "pick", title: "Pick EN", language_code: "en" },
      { game_id: "pick", title: "Pick FR", language_code: "fr" },
    ],
  });
  db.enqueue("game_genres", {
    data: [
      {
        game_id: "pick",
        genres: {
          id: "g1",
          slug: "rpg",
          genre_translations: [
            { name: "RPG", language_code: "en" },
            { name: "Jeu de rôle", language_code: "fr" },
          ],
        },
      },
    ],
  });
}

beforeEach(() => {
  db.reset();
  rpc.mockReset();
});

describe("getPersonalRecommendations", () => {
  it("scores through recommend_games_for_me and localises the cards with an English fallback", async () => {
    rpc.mockResolvedValue({ data: [row("pick")], error: null });
    enqueueMetadata();

    const recs = await getPersonalRecommendations(client, { limit: 5, locale: "fr" });

    expect(rpc).toHaveBeenCalledWith("recommend_games_for_me", { p_limit: 5 });
    expect(recs).toEqual([
      {
        id: "pick",
        slug: "pick-slug",
        title: "Pick FR",
        coverImage: "cover.jpg",
        genres: [{ id: "g1", name: "Jeu de rôle" }],
        developer: "Studio",
        metascore: 88,
        combinedScore: 0.5,
      },
    ]);
  });

  it("clamps the limit and skips picks without metadata", async () => {
    rpc.mockResolvedValue({ data: [row("ghost")], error: null });
    db.enqueue("games", { data: [] });

    const recs = await getPersonalRecommendations(client, { limit: 500 });

    expect(rpc).toHaveBeenCalledWith("recommend_games_for_me", { p_limit: 50 });
    expect(recs).toEqual([]);
  });

  it("returns no card and no metadata query for an empty result", async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    expect(await getPersonalRecommendations(client)).toEqual([]);
    expect(db.calls).toHaveLength(0);
  });

  it("surfaces RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "timeout" } });
    await expect(getPersonalRecommendations(client)).rejects.toThrow("recommend_games_for_me failed: timeout");
  });
});

describe("getRecommendationsForGame", () => {
  it("scores through recommend_similar_games", async () => {
    rpc.mockResolvedValue({ data: [row("pick")], error: null });
    enqueueMetadata();

    const recs = await getRecommendationsForGame(client, "game-1");

    expect(rpc).toHaveBeenCalledWith("recommend_similar_games", { p_game_id: "game-1", p_limit: 10 });
    expect(recs).toEqual([expect.objectContaining({ id: "pick", title: "Pick EN" })]);
    expect(recs[0]).not.toHaveProperty("reason");
  });
});

describe("countLibraryGames", () => {
  it("counts the user's library rows", async () => {
    db.enqueue("user_library", { count: 949 });

    expect(await countLibraryGames(client, "user-1")).toBe(949);
    expect(db.callsFor("user_library", "eq")).toEqual([["user_id", "user-1"]]);
  });
});
