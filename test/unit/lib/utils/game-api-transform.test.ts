import { describe, it, expect } from "vitest";
import { toFormData, extractCompaniesFromApi } from "@/lib/utils/game-api-transform";

const minimalGame = {
  id: "1",
  slug: "test-game",
  igdb_id: null,
  cover_image_url: null,
  background_image_url: null,
  background_color: null,
  accent_color: null,
  label_color: null,
  text_color: null,
  release_date: null,
  metascore: null,
  playtime_hastily: null,
  playtime_normally: null,
  playtime_completely: null,
  translations: [{ language_code: "fr", title: "Test", description: null, storyline: null }],
  genres: [],
  companies: [],
  screenshots: [],
  artwork: [],
  game_ratings: [],
  versions: [],
  languages: [],
  prices: [],
  game_platforms: [],
  videos: [],
  music: null,
} as any;

describe("toFormData", () => {
  it("maps slug and translations", () => {
    const result = toFormData(minimalGame);
    expect(result.slug).toBe("test-game");
    expect(result.translations).toEqual([
      { language_code: "fr", title: "Test", description: "", storyline: "" },
    ]);
  });

  it("null fields become empty strings", () => {
    const result = toFormData(minimalGame);
    expect(result.cover_image_url).toBe("");
    expect(result.background_image_url).toBe("");
    expect(result.release_date).toBe("");
    expect(result.metascore).toBe("");
  });

  it("empty arrays stay empty", () => {
    const result = toFormData(minimalGame);
    expect(result.genres).toEqual([]);
    expect(result.companies).toEqual([]);
    expect(result.screenshots).toEqual([]);
    expect(result.videos).toEqual([]);
  });

  it("maps music data", () => {
    const game = {
      ...minimalGame,
      music: {
        composer: "Hans Zimmer",
        spotify_embed_url: "https://spotify.com/embed/1",
        youtube_video_url: "https://youtube.com/watch?v=1",
      },
    } as any;
    const result = toFormData(game);
    expect(result.music_composer).toBe("Hans Zimmer");
    expect(result.music_spotify_embed_url).toBe("https://spotify.com/embed/1");
    expect(result.music_youtube_video_url).toBe("https://youtube.com/watch?v=1");
  });
});

describe("extractCompaniesFromApi", () => {
  it("extracts companies with company data", () => {
    const game = {
      ...minimalGame,
      companies: [
        {
          company_id: "c1",
          role: "developer",
          is_primary: true,
          company: { id: "c1", name: "Studio A", slug: "studio-a" },
        },
      ],
    } as any;
    expect(extractCompaniesFromApi(game)).toEqual([
      { id: "c1", name: "Studio A", slug: "studio-a" },
    ]);
  });

  it("skips companies without company data", () => {
    const game = {
      ...minimalGame,
      companies: [
        { company_id: "c1", role: "developer", is_primary: true },
        {
          company_id: "c2",
          role: "publisher",
          is_primary: false,
          company: { id: "c2", name: "Pub B", slug: "pub-b" },
        },
      ],
    } as any;
    expect(extractCompaniesFromApi(game)).toEqual([{ id: "c2", name: "Pub B", slug: "pub-b" }]);
  });

  it("returns empty array when no companies", () => {
    expect(extractCompaniesFromApi(minimalGame)).toEqual([]);
  });
});
