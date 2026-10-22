import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import {
  fetchHomeStats,
  fetchPopularCharacters,
  fetchRecentReviews,
} from "@/lib/services/homeLandingService";

const mock = createSupabaseQueryMock();
const client = mock.client as unknown as SupabaseClient;

beforeEach(() => mock.reset());

describe("fetchHomeStats", () => {
  it("returns the exact counts of games, characters, profiles and reviews", async () => {
    mock.enqueue("games", { count: 5321 });
    mock.enqueue("characters", { count: 2104 });
    mock.enqueue("profiles", { count: 812 });
    mock.enqueue("game_reviews", { count: 1290 });

    await expect(fetchHomeStats(client)).resolves.toEqual({
      games: 5321,
      characters: 2104,
      players: 812,
      reviews: 1290,
    });
    expect(mock.callsFor("profiles", "select")[0]).toEqual(["id", { count: "exact", head: true }]);
  });

  it("returns null when any count fails", async () => {
    mock.enqueue("games", { count: 10 });
    mock.enqueue("characters", { count: 5 });
    mock.enqueue("profiles", { error: { message: "denied" } });
    mock.enqueue("game_reviews", { count: 3 });

    await expect(fetchHomeStats(client)).resolves.toBeNull();
  });
});

describe("fetchPopularCharacters", () => {
  it("maps rows to summaries and skips characters without a name", async () => {
    mock.enqueue("characters", {
      data: [
        {
          id: "c1",
          slug: "kratos",
          main_image: "https://img/kratos.jpg",
          background_color: null,
          created_at: "2024-01-01",
          character_translations: [
            { language_code: "fr", name: "Kratos", role: "Héros", description: null },
          ],
          character_games: [
            {
              is_primary: true,
              games: { id: "g1", slug: "gow", game_translations: [{ title: "God of War" }] },
            },
          ],
        },
        {
          id: "c2",
          slug: "nameless",
          main_image: "https://img/x.jpg",
          background_color: null,
          created_at: "2024-01-01",
          character_translations: [],
          character_games: [],
        },
      ],
    });

    const characters = await fetchPopularCharacters(client, "fr");

    expect(characters).toEqual([
      {
        id: "c1",
        slug: "kratos",
        name: "Kratos",
        role: "Héros",
        mainImage: "https://img/kratos.jpg",
        primaryGame: "God of War",
        gamesCount: 1,
      },
    ]);
  });

  it("returns an empty list on error", async () => {
    mock.enqueue("characters", { error: { message: "boom" } });
    await expect(fetchPopularCharacters(client, "fr")).resolves.toEqual([]);
  });
});

describe("fetchRecentReviews", () => {
  it("joins author, game title and vote counts", async () => {
    mock.enqueue("game_reviews", {
      data: [
        {
          id: "r1",
          user_id: "u1",
          game_id: "g1",
          rating: 17,
          content: "<p>Great</p>",
          positive_points: ["Story"],
          negative_points: null,
          created_at: "2026-09-01",
          updated_at: "2026-09-01",
          games: {
            slug: "gow",
            game_translations: [
              { language_code: "en", title: "God of War" },
              { language_code: "fr", title: "God of War FR" },
            ],
          },
        },
      ],
    });
    mock.enqueue("profiles", { data: [{ id: "u1", username: "nova", avatar_url: null }] });
    mock.enqueue("review_votes", {
      data: [
        { review_id: "r1", vote_type: "helpful" },
        { review_id: "r1", vote_type: "helpful" },
      ],
    });

    const [review] = await fetchRecentReviews(client, "fr");

    expect(review).toMatchObject({
      id: "r1",
      playerName: "nova",
      gameTitle: "God of War FR",
      gameSlug: "gow",
      negativePoints: [],
      voteCounts: { helpful: 2, notHelpful: 0 },
      userVote: null,
    });
  });
});
