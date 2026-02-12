import { describe, it, expect } from "bun:test";
import {
  genreTranslationSchema,
  adminGenreFormSchema,
  genreQuerySchema,
  type GenreFormData,
} from "../../../../src/lib/validations/admin-genre-form";

describe("genreTranslationSchema", () => {
  it("accepts a valid translation", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "fr",
      name: "Action",
      description: "Jeux d'action",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string description", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "en",
      name: "RPG",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined description", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "fr",
      name: "Action",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "fr",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "fr",
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name of exactly 100 characters", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "fr",
      name: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description longer than 500 characters", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "fr",
      name: "Action",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts description of exactly 500 characters", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "fr",
      name: "Action",
      description: "a".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty language_code", () => {
    const result = genreTranslationSchema.safeParse({
      language_code: "",
      name: "Action",
    });
    expect(result.success).toBe(false);
  });
});

describe("adminGenreFormSchema", () => {
  const validForm: GenreFormData = {
    slug: "action",
    translations: [{ language_code: "fr", name: "Action" }],
  };

  describe("slug field", () => {
    it("accepts a valid slug", () => {
      const result = adminGenreFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });

    it("accepts slug with numbers and hyphens", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "tower-defense2",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a 2-character slug", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "rp",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a 50-character slug", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "a" + "b".repeat(48) + "c",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a single character slug", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "a",
      });
      expect(result.success).toBe(false);
    });

    it("rejects slug longer than 50 characters", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("rejects uppercase letters", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "Action",
      });
      expect(result.success).toBe(false);
    });

    it("rejects slug starting with a number", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "1action",
      });
      expect(result.success).toBe(false);
    });

    it("rejects slug starting with a hyphen", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "-action",
      });
      expect(result.success).toBe(false);
    });

    it("rejects slug ending with a hyphen", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "action-",
      });
      expect(result.success).toBe(false);
    });

    it("rejects slug with spaces", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "tower defense",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty slug", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        slug: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("translations field", () => {
    it("accepts one translation", () => {
      const result = adminGenreFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });

    it("accepts multiple translations", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        translations: [
          { language_code: "fr", name: "Action", description: "Jeux d'action" },
          { language_code: "en", name: "Action", description: "Action games" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty translations array", () => {
      const result = adminGenreFormSchema.safeParse({
        ...validForm,
        translations: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing translations", () => {
      const result = adminGenreFormSchema.safeParse({ slug: "action" });
      expect(result.success).toBe(false);
    });
  });

  describe("error messages", () => {
    it("returns descriptive error for short slug", () => {
      const result = adminGenreFormSchema.safeParse({ ...validForm, slug: "a" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const slugErrors = result.error.issues.filter((i) => i.path[0] === "slug");
        expect(slugErrors.some((e) => e.message.includes("2 caractères"))).toBe(true);
      }
    });

    it("returns descriptive error for invalid slug pattern", () => {
      const result = adminGenreFormSchema.safeParse({ ...validForm, slug: "Action" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const slugErrors = result.error.issues.filter((i) => i.path[0] === "slug");
        expect(slugErrors.some((e) => e.message.includes("minuscules"))).toBe(true);
      }
    });

    it("returns descriptive error for empty translations", () => {
      const result = adminGenreFormSchema.safeParse({ ...validForm, translations: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        const translationErrors = result.error.issues.filter((i) => i.path[0] === "translations");
        expect(translationErrors.some((e) => e.message.includes("traduction"))).toBe(true);
      }
    });
  });

  describe("type inference", () => {
    it("produces correct GenreFormData type", () => {
      const data: GenreFormData = {
        slug: "rpg",
        translations: [{ language_code: "fr", name: "Jeu de rôle", description: "Jeux de rôle" }],
      };
      const result = adminGenreFormSchema.parse(data);
      expect(result.slug).toBe("rpg");
      expect(result.translations).toHaveLength(1);
      expect(result.translations[0].name).toBe("Jeu de rôle");
    });
  });
});

describe("genreQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = genreQuerySchema.safeParse({
      page: 1,
      limit: 20,
      search: "action",
      sort_by: "slug",
      sort_order: "asc",
      locale: "fr",
    });
    expect(result.success).toBe(true);
  });

  it("applies defaults for missing params", () => {
    const result = genreQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort_by).toBe("slug");
      expect(result.data.sort_order).toBe("asc");
      expect(result.data.locale).toBe("fr");
    }
  });

  it("coerces string numbers", () => {
    const result = genreQuerySchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects page less than 1", () => {
    const result = genreQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit greater than 100", () => {
    const result = genreQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sort_by", () => {
    const result = genreQuerySchema.safeParse({ sort_by: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sort_order", () => {
    const result = genreQuerySchema.safeParse({ sort_order: "random" });
    expect(result.success).toBe(false);
  });
});
