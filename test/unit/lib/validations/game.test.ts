import { describe, it, expect } from "vitest";
import {
  gameBaseSchema,
  gameTranslationSchema,
  gameCompanySchema,
  adminGameQuerySchema,
  createGameSchema,
} from "@/lib/validations/game";

describe("gameBaseSchema", () => {
  it("accepts valid minimal data with slug only", () => {
    expect(gameBaseSchema.safeParse({ slug: "my-game" }).success).toBe(true);
  });

  it("rejects slug with spaces", () => {
    expect(gameBaseSchema.safeParse({ slug: "my game" }).success).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    expect(gameBaseSchema.safeParse({ slug: "My-Game" }).success).toBe(false);
  });

  it("rejects empty slug", () => {
    expect(gameBaseSchema.safeParse({ slug: "" }).success).toBe(false);
  });

  it("accepts valid hex color for background_color", () => {
    const result = gameBaseSchema.safeParse({ slug: "g", background_color: "#FF00AA" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const result = gameBaseSchema.safeParse({ slug: "g", background_color: "red" });
    expect(result.success).toBe(false);
  });

  it("rejects metascore above 100", () => {
    expect(gameBaseSchema.safeParse({ slug: "g", metascore: 101 }).success).toBe(false);
  });

  it("rejects metascore below 0", () => {
    expect(gameBaseSchema.safeParse({ slug: "g", metascore: -1 }).success).toBe(false);
  });

  it("rejects negative playtime", () => {
    expect(gameBaseSchema.safeParse({ slug: "g", playtime_hastily: -5 }).success).toBe(false);
  });
});

describe("gameTranslationSchema", () => {
  it("accepts valid translation", () => {
    const result = gameTranslationSchema.safeParse({ language_code: "fr", title: "Mon Jeu" });
    expect(result.success).toBe(true);
  });

  it("rejects language_code with 3 chars", () => {
    expect(
      gameTranslationSchema.safeParse({ language_code: "fra", title: "Mon Jeu" }).success
    ).toBe(false);
  });

  it("rejects empty title", () => {
    expect(
      gameTranslationSchema.safeParse({ language_code: "fr", title: "" }).success
    ).toBe(false);
  });
});

describe("gameCompanySchema", () => {
  const validCompany = {
    company_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    role: "developer",
    is_primary: false,
  };

  it("accepts valid company", () => {
    expect(gameCompanySchema.safeParse(validCompany).success).toBe(true);
  });

  it("rejects invalid role", () => {
    expect(
      gameCompanySchema.safeParse({ ...validCompany, role: "designer" }).success
    ).toBe(false);
  });

  it("rejects non-uuid company_id", () => {
    expect(
      gameCompanySchema.safeParse({ ...validCompany, company_id: "not-a-uuid" }).success
    ).toBe(false);
  });
});

describe("adminGameQuerySchema", () => {
  it("applies defaults for empty input", () => {
    const result = adminGameQuerySchema.parse({});
    expect(result).toMatchObject({
      page: 1,
      limit: 20,
      sort_by: "created_at",
      sort_order: "desc",
      locale: "fr",
    });
  });

  it("coerces page from string", () => {
    const result = adminGameQuerySchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });
});

describe("createGameSchema", () => {
  const base = {
    game: { slug: "test-game" },
    translations: [{ language_code: "fr", title: "Test" }],
    companies: [
      { company_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", role: "developer", is_primary: false },
    ],
    genres: [{ genre_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }],
  };

  it("rejects when translations empty", () => {
    expect(createGameSchema.safeParse({ ...base, translations: [] }).success).toBe(false);
  });

  it("rejects when companies empty", () => {
    expect(createGameSchema.safeParse({ ...base, companies: [] }).success).toBe(false);
  });

  it("rejects when genres empty", () => {
    expect(createGameSchema.safeParse({ ...base, genres: [] }).success).toBe(false);
  });
});
