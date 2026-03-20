import { describe, it, expect } from "vitest";
import {
  detectChangedFields,
  TRACKABLE_FIELDS,
  type CurrentGameData,
} from "../../../../src/lib/utils/field-tracking";
import type { AdminGameFormData } from "../../../../src/lib/validations/admin-game-form";

// =============================================================================
// TRACKABLE_FIELDS
// =============================================================================

describe("TRACKABLE_FIELDS", () => {
  it("contient exactement les 15 catégories attendues", () => {
    expect(TRACKABLE_FIELDS).toHaveLength(15);
    const expected = [
      "translations",
      "cover_image",
      "background_image",
      "release_date",
      "metascore",
      "genres",
      "companies",
      "platforms",
      "screenshots",
      "artworks",
      "age_ratings",
      "versions",
      "languages",
      "playtime",
      "videos",
    ];
    expect([...TRACKABLE_FIELDS]).toEqual(expected);
  });
});

// =============================================================================
// detectChangedFields
// =============================================================================

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
    prices: [],
    ...overrides,
  } as AdminGameFormData;
}

describe("detectChangedFields", () => {
  it("retourne un tableau vide quand rien n'a changé", () => {
    const result = detectChangedFields(baseCurrentData, toSubmitted());
    expect(result).toEqual([]);
  });

  it("détecte un seul changement (cover_image)", () => {
    const result = detectChangedFields(
      baseCurrentData,
      toSubmitted({ cover_image_url: "https://example.com/new-cover.png" })
    );
    expect(result).toEqual(["cover_image"]);
  });

  it("détecte tous les changements quand tout est modifié", () => {
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
    });

    const result = detectChangedFields(baseCurrentData, submitted);
    // "videos" is not detectable via admin form — only 14 fields are form-comparable
    const formComparableFields = TRACKABLE_FIELDS.filter((f) => f !== "videos");
    expect(result).toHaveLength(formComparableFields.length);
    expect(result).toEqual(expect.arrayContaining([...formComparableFields]));
  });

  it("gère les valeurs null/vides correctement (pas de faux positif)", () => {
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
    });

    const result = detectChangedFields(emptyCurrentData, emptySubmitted);
    expect(result).toEqual([]);
  });
});
