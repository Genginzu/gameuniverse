/**
 * Tests d'intégration pour le field tracking dans le PUT admin games.
 * Vérifie que la détection des modifications + upsert des overrides
 * fonctionne correctement dans le contexte d'une mise à jour de jeu.
 */

import { describe, it, expect, vi } from "vitest";
import {
  detectChangedFields,
  upsertFieldOverrides,
  type CurrentGameData,
} from "../../../src/lib/utils/field-tracking";
import type { AdminGameFormData } from "../../../src/lib/validations/admin-game-form";

// --- Helpers ---

const GAME_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000099";

/** Données actuelles d'un jeu en DB (avant la mise à jour PUT) */
const currentGameData: CurrentGameData = {
  cover_image_url: "https://example.com/cover.png",
  background_image_url: "https://example.com/bg.png",
  release_date: "2024-01-15",
  metascore: 85,
  playtime_hastily: 5,
  playtime_normally: 10,
  playtime_completely: 20,
  translations: [{ language_code: "fr", title: "Mon Jeu", description: "Desc FR" }],
  genres: [{ genre_id: "genre-1" }],
  companies: [{ company_id: "comp-1", role: "developer", is_primary: true }],
  screenshots: [{ url: "https://example.com/shot1.png" }],
  artwork: [{ url: "https://example.com/art1.png" }],
  age_ratings: [{ rating_id: "rating-1", is_primary: true, content_descriptors: ["desc-1"] }],
  versions: [{ version_title: "Standard", description: "Base game" }],
  languages: [{ language_code: "fr", has_audio: true, has_subtitles: true, has_interface: true }],
};

/** Construit un objet AdminGameFormData à partir de currentGameData + overrides */
function buildSubmittedData(overrides: Partial<AdminGameFormData> = {}): AdminGameFormData {
  return {
    slug: "",
    cover_image_url: "https://example.com/cover.png",
    background_image_url: "https://example.com/bg.png",
    release_date: "2024-01-15",
    metascore: 85,
    playtime_hastily: 5,
    playtime_normally: 10,
    playtime_completely: 20,
    translations: [{ language_code: "fr", title: "Mon Jeu", description: "Desc FR" }],
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
    prices: [],
    ...overrides,
  } as AdminGameFormData;
}

/** Crée un mock Supabase qui enregistre les appels upsert */
function createMockSupabase() {
  const upsertedRows: unknown[] = [];
  return {
    client: {
      from: (_table: string) => ({
        upsert: (rows: unknown[], _opts: unknown) => {
          if (Array.isArray(rows)) upsertedRows.push(...rows);
          return { select: () => ({ error: null }) };
        },
      }),
    },
    upsertedRows,
  };
}

// --- Tests ---

describe("PUT admin games - field tracking integration", () => {
  it("crée des overrides quand des champs sont modifiés", async () => {
    const submitted = buildSubmittedData({
      cover_image_url: "https://example.com/new-cover.png",
      metascore: 92,
    });

    const changedFields = detectChangedFields(currentGameData, submitted);
    expect(changedFields).toContain("cover_image");
    expect(changedFields).toContain("metascore");
    expect(changedFields).toHaveLength(2);

    const { client, upsertedRows } = createMockSupabase();
    await upsertFieldOverrides(client as never, GAME_ID, changedFields, USER_ID);

    expect(upsertedRows).toHaveLength(2);
    expect(upsertedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          game_id: GAME_ID,
          field_name: "cover_image",
          modified_by: USER_ID,
        }),
        expect.objectContaining({
          game_id: GAME_ID,
          field_name: "metascore",
          modified_by: USER_ID,
        }),
      ])
    );
  });

  it("ne crée aucun override quand rien n'a changé", async () => {
    const submitted = buildSubmittedData();

    const changedFields = detectChangedFields(currentGameData, submitted);
    expect(changedFields).toHaveLength(0);

    // upsertFieldOverrides retourne immédiatement si changedFields est vide
    const { client, upsertedRows } = createMockSupabase();
    await upsertFieldOverrides(client as never, GAME_ID, changedFields, USER_ID);
    expect(upsertedRows).toHaveLength(0);
  });

  it("détecte les modifications de relations (genres, companies)", async () => {
    const submitted = buildSubmittedData({
      genres: [{ genre_id: "genre-1" }, { genre_id: "genre-2" }],
      companies: [{ company_id: "comp-99", role: "publisher", is_primary: false }],
    });

    const changedFields = detectChangedFields(currentGameData, submitted);
    expect(changedFields).toContain("genres");
    expect(changedFields).toContain("companies");

    const { client, upsertedRows } = createMockSupabase();
    await upsertFieldOverrides(client as never, GAME_ID, changedFields, USER_ID);

    expect(upsertedRows).toHaveLength(2);
    const fieldNames = upsertedRows.map((r: any) => r.field_name);
    expect(fieldNames).toContain("genres");
    expect(fieldNames).toContain("companies");
  });

  it("enregistre le user_id correct dans les overrides", async () => {
    const submitted = buildSubmittedData({ release_date: "2025-12-01" });

    const changedFields = detectChangedFields(currentGameData, submitted);
    const { client, upsertedRows } = createMockSupabase();
    await upsertFieldOverrides(client as never, GAME_ID, changedFields, USER_ID);

    expect(upsertedRows).toHaveLength(1);
    expect((upsertedRows[0] as any).modified_by).toBe(USER_ID);
    expect((upsertedRows[0] as any).game_id).toBe(GAME_ID);
  });
});
