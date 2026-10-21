import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { fetchShowcaseCharacters, fetchShowcaseGames } from "@/lib/services/homeShowcaseQueries";

const mock = createSupabaseQueryMock();
const client = mock.client as unknown as SupabaseClient;

beforeEach(() => mock.reset());

describe("fetchShowcaseGames", () => {
  it("returns the picked games in order with their status", async () => {
    mock.enqueue("home_showcase_items", {
      data: [
        {
          library_status: "completed",
          games: {
            id: "g1",
            slug: "hades",
            cover_image_url: "https://img/h.jpg",
            game_translations: [{ language_code: "fr", title: "Hadès", description: null }],
            game_genres: [],
            game_companies: [],
          },
        },
        { library_status: "playing", games: null },
      ],
    });

    const items = await fetchShowcaseGames(client, "fr");

    expect(items).toHaveLength(1);
    expect(items[0].status).toBe("completed");
    expect(items[0].game).toMatchObject({ id: "g1", slug: "hades", title: "Hadès" });
    expect(mock.callsFor("home_showcase_items", "eq")).toEqual([["kind", "game"]]);
  });

  it("returns an empty list on error", async () => {
    mock.enqueue("home_showcase_items", { error: { message: "missing table" } });
    await expect(fetchShowcaseGames(client, "fr")).resolves.toEqual([]);
  });
});

describe("fetchShowcaseCharacters", () => {
  it("maps characters with a localized primary game", async () => {
    mock.enqueue("home_showcase_items", {
      data: [
        {
          characters: {
            id: "c1",
            slug: "aloy",
            main_image: "https://img/a.jpg",
            background_color: null,
            created_at: "2024-01-01",
            character_translations: [
              { language_code: "fr", name: "Aloy", role: null, description: null },
            ],
            character_games: [
              {
                is_primary: true,
                games: {
                  id: "g",
                  slug: "hzd",
                  game_translations: [
                    { language_code: "en", title: "Horizon EN", description: null },
                    { language_code: "fr", title: "Horizon FR", description: null },
                  ],
                },
              },
            ],
          },
        },
      ],
    });

    const [character] = await fetchShowcaseCharacters(client, "fr");

    expect(character).toMatchObject({ slug: "aloy", name: "Aloy", primaryGame: "Horizon FR" });
  });
});
