import { describe, it, expect } from "vitest";
import {
  detectChangedFields,
  TRACKABLE_FIELDS,
  TRACKED_FIELD_REGISTRY,
} from "@/lib/services/igdb-fields/registry";
import type { CurrentGameData } from "@/types/admin-games";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";

const baseCurrentData: CurrentGameData = {
  cover_image_url: "https://example.com/cover.png",
  background_image_url: "https://example.com/bg.png",
  release_date: "2024-01-15",
  metascore: 85,
  playtime_hastily: 5,
  playtime_normally: 10,
  playtime_completely: 20,
  translations: [{ language_code: "fr", title: "Mon Jeu", description: "Description FR" }],
  genres: [{ genre_id: "genre-1" }],
  companies: [{ company_id: "comp-1", role: "developer", is_primary: true }],
  screenshots: [{ url: "https://example.com/shot1.png" }],
  artwork: [{ url: "https://example.com/art1.png" }],
  age_ratings: [{ rating_id: "rating-1", is_primary: true, content_descriptors: ["desc-1"] }],
  versions: [{ version_title: "Standard", description: "Base game" }],
  languages: [{ language_code: "fr", has_audio: true, has_subtitles: true, has_interface: true }],
  game_platforms: [{ platform_id: "platform-1" }],
  videos: [{ url: "https://www.youtube.com/watch?v=abc", title: "Trailer" }],
};

const baseVideo = {
  url: "https://www.youtube.com/watch?v=abc",
  title: "Trailer",
  thumbnail_url: "",
  video_type: "trailer",
  display_order: 0,
  is_featured: true,
};

function toSubmitted(overrides: Partial<AdminGameFormData> = {}): AdminGameFormData {
  return {
    slug: "",
    cover_image_url: "https://example.com/cover.png",
    background_image_url: "https://example.com/bg.png",
    release_date: "2024-01-15",
    metascore: 85,
    playtime_hastily: 5,
    playtime_normally: 10,
    playtime_completely: 20,
    translations: [{ language_code: "fr", title: "Mon Jeu", description: "Description FR" }],
    genres: [{ genre_id: "genre-1" }],
    companies: [{ company_id: "comp-1", role: "developer", is_primary: true }],
    screenshots: [
      {
        url: "https://example.com/shot1.png",
        alt_text: "",
        caption: "",
        display_order: 0,
        is_featured: false,
      },
    ],
    artwork: [
      {
        url: "https://example.com/art1.png",
        alt_text: "",
        caption: "",
        artwork_type: "",
        display_order: 0,
        is_featured: false,
      },
    ],
    age_ratings: [{ rating_id: "rating-1", is_primary: true, content_descriptors: ["desc-1"] }],
    versions: [{ version_title: "Standard", description: "Base game" }],
    languages: [
      {
        language_code: "fr",
        language_name: "Français",
        has_audio: true,
        has_subtitles: true,
        has_interface: true,
      },
    ],
    game_platforms: [{ platform_id: "platform-1" }],
    videos: [baseVideo],
    prices: [],
    ...overrides,
  } as AdminGameFormData;
}

describe("detectChangedFields", () => {
  it("returns an empty list when nothing changed", () => {
    expect(detectChangedFields(baseCurrentData, toSubmitted())).toEqual([]);
  });

  it("detects a single change (cover_image)", () => {
    const result = detectChangedFields(
      baseCurrentData,
      toSubmitted({ cover_image_url: "https://example.com/new-cover.png" })
    );
    expect(result).toEqual(["cover_image"]);
  });

  it("detects every admin-editable field when everything changed", () => {
    const submitted = toSubmitted({
      cover_image_url: "https://new.com/cover.png",
      background_image_url: "https://new.com/bg.png",
      release_date: "2025-06-01",
      metascore: 50,
      playtime_hastily: 99,
      playtime_normally: 99,
      playtime_completely: 99,
      translations: [{ language_code: "en", title: "New Game", description: "New desc" }],
      genres: [{ genre_id: "genre-99" }],
      companies: [{ company_id: "comp-99", role: "publisher", is_primary: false }],
      screenshots: [
        {
          url: "https://new.com/shot.png",
          alt_text: "",
          caption: "",
          display_order: 0,
          is_featured: false,
        },
      ],
      artwork: [
        {
          url: "https://new.com/art.png",
          alt_text: "",
          caption: "",
          artwork_type: "",
          display_order: 0,
          is_featured: false,
        },
      ],
      age_ratings: [{ rating_id: "rating-99", is_primary: false, content_descriptors: [] }],
      versions: [{ version_title: "Deluxe", description: "All DLC" }],
      languages: [
        {
          language_code: "en",
          language_name: "English",
          has_audio: false,
          has_subtitles: false,
          has_interface: false,
        },
      ],
      game_platforms: [{ platform_id: "platform-99" }],
      videos: [{ ...baseVideo, url: "https://www.youtube.com/watch?v=xyz" }],
    });

    const detectableFields = TRACKABLE_FIELDS.filter(
      (field) => TRACKED_FIELD_REGISTRY[field].detect !== null
    );
    expect(detectChangedFields(baseCurrentData, submitted)).toEqual(detectableFields);
  });

  it("does not report false positives for null and empty values", () => {
    const emptyCurrentData: CurrentGameData = {
      cover_image_url: null,
      background_image_url: "",
      release_date: null,
      metascore: null,
      playtime_hastily: null,
      playtime_normally: null,
      playtime_completely: null,
      translations: [],
      genres: [],
      companies: [],
      screenshots: [],
      artwork: [],
      age_ratings: [],
      versions: [],
      languages: [],
      game_platforms: [],
      videos: [],
    };

    const emptySubmitted = toSubmitted({
      cover_image_url: "",
      background_image_url: "",
      release_date: "",
      metascore: null,
      playtime_hastily: null,
      playtime_normally: null,
      playtime_completely: null,
      translations: [],
      genres: [],
      companies: [],
      screenshots: [],
      artwork: [],
      age_ratings: [],
      versions: [],
      languages: [],
      game_platforms: [],
      videos: [],
    });

    expect(detectChangedFields(emptyCurrentData, emptySubmitted)).toEqual([]);
  });

  it("treats a null version description as equal to an empty one", () => {
    const current: CurrentGameData = {
      ...baseCurrentData,
      versions: [{ version_title: "Standard", description: null }],
    };
    const submitted = toSubmitted({ versions: [{ version_title: "Standard", description: "" }] });
    expect(detectChangedFields(current, submitted)).toEqual([]);
  });
});

describe("detectChangedFields - videos override", () => {
  it("flags videos when an admin removes a video", () => {
    expect(detectChangedFields(baseCurrentData, toSubmitted({ videos: [] }))).toEqual(["videos"]);
  });

  it("flags videos when an admin adds a video", () => {
    const videos = [baseVideo, { ...baseVideo, url: "https://www.youtube.com/watch?v=new" }];
    expect(detectChangedFields(baseCurrentData, toSubmitted({ videos }))).toEqual(["videos"]);
  });

  it("flags videos when an admin renames a video", () => {
    const videos = [{ ...baseVideo, title: "Launch trailer" }];
    expect(detectChangedFields(baseCurrentData, toSubmitted({ videos }))).toEqual(["videos"]);
  });

  it("ignores video reordering and non-tracked video attributes", () => {
    const current: CurrentGameData = {
      ...baseCurrentData,
      videos: [
        { url: "https://www.youtube.com/watch?v=abc", title: "Trailer" },
        { url: "https://www.youtube.com/watch?v=def", title: null },
      ],
    };
    const videos = [
      { ...baseVideo, url: "https://www.youtube.com/watch?v=def", title: "", display_order: 0 },
      { ...baseVideo, display_order: 1, is_featured: false },
    ];
    expect(detectChangedFields(current, toSubmitted({ videos }))).toEqual([]);
  });
});
