import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import {
  BULK_FIELD_TO_OVERRIDE,
  BULK_IMPORTABLE_COLUMNS,
  TRACKABLE_FIELDS,
  TRACKED_FIELD_REGISTRY,
  WEBHOOK_TRACKED_PAYLOAD_KEYS,
  isBulkFieldAlias,
  isTrackableField,
} from "@/lib/services/igdb-fields/registry";
import { FIELD_SYNC_MAP } from "@/lib/services/igdb-fields/sync-map";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";

const NOT_ADMIN_FORM_EDITABLE = ["popularity", "similar_games"];
const WEBHOOK_ONLY_PAYLOAD_KEYS = ["slug"];

function formLabels(messages: unknown): Record<string, unknown> {
  return (messages as { admin: { games: { form: Record<string, unknown> } } }).admin.games.form;
}

function readWebhookPayloadKeys(): string[] {
  const source = readFileSync(
    resolve(process.cwd(), "supabase/functions/_shared/webhook-diff-applier.ts"),
    "utf8"
  );
  const block = source.match(/const TRACKABLE_PAYLOAD_KEYS = \[([\s\S]*?)\] as const;/);
  if (!block) throw new Error("TRACKABLE_PAYLOAD_KEYS not found in webhook-diff-applier.ts");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

describe("TRACKED_FIELD_REGISTRY", () => {
  it.each(TRACKABLE_FIELDS)("%s has a label translated in fr and en", (field) => {
    const { labelKey } = TRACKED_FIELD_REGISTRY[field];
    expect(typeof formLabels(fr)[labelKey]).toBe("string");
    expect(typeof formLabels(en)[labelKey]).toBe("string");
  });

  it.each(TRACKABLE_FIELDS)("%s has a sync function", (field) => {
    expect(typeof FIELD_SYNC_MAP[field].run).toBe("function");
  });

  it.each(TRACKABLE_FIELDS)("%s has a change detector or an explicit null", (field) => {
    const { detect } = TRACKED_FIELD_REGISTRY[field];
    if (NOT_ADMIN_FORM_EDITABLE.includes(field)) {
      expect(detect).toBeNull();
    } else {
      expect(typeof detect).toBe("function");
    }
  });

  it("keeps the sync map keys aligned with the registry", () => {
    expect(Object.keys(FIELD_SYNC_MAP)).toEqual([...TRACKABLE_FIELDS]);
  });

  it("guards trackable field names", () => {
    expect(isTrackableField("videos")).toBe(true);
    expect(isTrackableField("toString")).toBe(false);
    expect(isTrackableField(undefined)).toBe(false);
  });
});

describe("bulk import aliases", () => {
  it("maps every alias to a tracked field and a games column", () => {
    expect(BULK_FIELD_TO_OVERRIDE).toEqual({
      cover: "cover_image",
      background: "background_image",
      releaseDate: "release_date",
      metascore: "metascore",
      playtime: "playtime",
      popularity: "popularity",
      themes: "themes",
      gameModes: "game_modes",
      playerPerspectives: "player_perspectives",
      multiplayerModes: "multiplayer_modes",
      franchises: "franchises",
      keywords: "keywords",
      gameEngines: "game_engines",
      websites: "websites",
      igdbRating: "igdb_rating",
    });
    expect(Object.keys(BULK_IMPORTABLE_COLUMNS).sort()).toEqual(
      Object.keys(BULK_FIELD_TO_OVERRIDE).sort()
    );
  });

  it("guards bulk aliases", () => {
    expect(isBulkFieldAlias("cover")).toBe(true);
    expect(isBulkFieldAlias("cover_image")).toBe(false);
  });
});

describe("Deno webhook diff applier", () => {
  it("listens to exactly the registry payload keys", () => {
    const expected = [...WEBHOOK_TRACKED_PAYLOAD_KEYS, ...WEBHOOK_ONLY_PAYLOAD_KEYS].sort();
    expect(readWebhookPayloadKeys().sort()).toEqual(expected);
  });
});
