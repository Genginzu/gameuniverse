import { describe, it, expect } from "vitest";
import {
  entityTypeSchema,
  missingQuerySchema,
  translateBodySchema,
  translateBatchBodySchema,
  saveTranslationBodySchema,
} from "@/lib/validations/admin-translation";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("entityTypeSchema", () => {
  it("passes for 'games'", () => {
    expect(entityTypeSchema.parse("games")).toBe("games");
  });

  it("rejects 'invalid'", () => {
    expect(() => entityTypeSchema.parse("invalid")).toThrow();
  });
});

describe("missingQuerySchema", () => {
  it("passes with valid type and applies defaults", () => {
    const result = missingQuerySchema.parse({ type: "games" });
    expect(result).toEqual({ type: "games", page: 1, limit: 20 });
  });

  it("rejects invalid type", () => {
    expect(() => missingQuerySchema.parse({ type: "invalid" })).toThrow();
  });
});

describe("translateBodySchema", () => {
  it("passes with valid data", () => {
    const result = translateBodySchema.parse({
      entityType: "games",
      entityId: VALID_UUID,
      targetLang: "en",
      saveToDb: true,
    });
    expect(result.entityType).toBe("games");
    expect(result.entityId).toBe(VALID_UUID);
  });

  it("rejects non-uuid entityId", () => {
    expect(() =>
      translateBodySchema.parse({
        entityType: "games",
        entityId: "not-a-uuid",
        targetLang: "en",
      })
    ).toThrow();
  });

  it("rejects targetLang not 2 chars", () => {
    expect(() =>
      translateBodySchema.parse({
        entityType: "games",
        entityId: VALID_UUID,
        targetLang: "eng",
      })
    ).toThrow();
  });
});

describe("translateBatchBodySchema", () => {
  it("passes with 1 entityId", () => {
    const result = translateBatchBodySchema.parse({
      entityType: "games",
      entityIds: [VALID_UUID],
      targetLang: "en",
    });
    expect(result.entityIds).toHaveLength(1);
  });

  it("rejects empty entityIds (min 1)", () => {
    expect(() =>
      translateBatchBodySchema.parse({
        entityType: "games",
        entityIds: [],
        targetLang: "en",
      })
    ).toThrow();
  });

  it("rejects more than 50 entityIds (max 50)", () => {
    expect(() =>
      translateBatchBodySchema.parse({
        entityType: "games",
        entityIds: Array.from({ length: 51 }, () => VALID_UUID),
        targetLang: "en",
      })
    ).toThrow();
  });
});

describe("saveTranslationBodySchema", () => {
  it("passes with valid translations record", () => {
    const result = saveTranslationBodySchema.parse({
      entityType: "games",
      entityId: VALID_UUID,
      targetLang: "en",
      translations: { name: "My Game", description: "A great game" },
    });
    expect(result.translations).toEqual({
      name: "My Game",
      description: "A great game",
    });
  });
});
