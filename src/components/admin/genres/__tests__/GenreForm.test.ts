import { describe, it, expect } from "vitest";

/**
 * GenreForm Unit Tests
 *
 * Tests the display logic that drives the GenreForm component:
 * 1. Translation sync logic — ensures translations array matches supported languages
 * 2. Slug field disabled state in edit mode
 * 3. Form data structure for create vs edit
 *
 * Requirements: 2.1, 2.3, 3.1, 3.3, 5.3, 6.1, 6.3
 */

interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string | null;
}

interface GenreTranslation {
  language_code: string;
  name: string;
  description: string;
}

/**
 * Mirrors the translation sync logic in GenreFormTranslations.tsx useEffect.
 * Ensures every supported language has a corresponding translation entry.
 */
function syncTranslationsWithLanguages(
  currentTranslations: GenreTranslation[],
  supportedLanguages: SupportedLanguage[]
): GenreTranslation[] {
  return supportedLanguages.map((lang) => {
    const existing = currentTranslations.find((tr) => tr.language_code === lang.code);
    return existing ?? { language_code: lang.code, name: "", description: "" };
  });
}

/** Determines whether the slug field should be disabled based on form mode. */
function isSlugDisabled(mode: "create" | "edit"): boolean {
  return mode === "edit";
}

/** Builds the API payload based on form mode (slug is excluded in edit). */
function buildSubmitPayload(
  mode: "create" | "edit",
  data: { slug: string; translations: GenreTranslation[] }
) {
  if (mode === "create") {
    return { slug: data.slug, translations: data.translations };
  }
  return { translations: data.translations };
}

const languages: SupportedLanguage[] = [
  { code: "fr", name: "French", native_name: "Français" },
  { code: "en", name: "English", native_name: null },
  { code: "es", name: "Spanish", native_name: "Español" },
];

describe("GenreForm Logic", () => {
  describe("Translation Sync (Req 6.1)", () => {
    it("creates empty translations for all supported languages when none exist", () => {
      const result = syncTranslationsWithLanguages([], languages);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ language_code: "fr", name: "", description: "" });
      expect(result[1]).toEqual({ language_code: "en", name: "", description: "" });
      expect(result[2]).toEqual({ language_code: "es", name: "", description: "" });
    });

    it("preserves existing translations when they match supported languages", () => {
      const existing: GenreTranslation[] = [
        { language_code: "fr", name: "Action", description: "Jeux d'action" },
        { language_code: "en", name: "Action", description: "Action games" },
      ];

      const result = syncTranslationsWithLanguages(existing, languages);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        language_code: "fr",
        name: "Action",
        description: "Jeux d'action",
      });
      expect(result[1]).toEqual({
        language_code: "en",
        name: "Action",
        description: "Action games",
      });
      expect(result[2]).toEqual({ language_code: "es", name: "", description: "" });
    });

    it("drops translations for unsupported languages", () => {
      const existing: GenreTranslation[] = [
        { language_code: "fr", name: "Action", description: "" },
        { language_code: "de", name: "Aktion", description: "" },
      ];
      const twoLanguages: SupportedLanguage[] = [
        { code: "fr", name: "French", native_name: "Français" },
        { code: "en", name: "English", native_name: null },
      ];

      const result = syncTranslationsWithLanguages(existing, twoLanguages);

      expect(result).toHaveLength(2);
      expect(result[0].language_code).toBe("fr");
      expect(result[1].language_code).toBe("en");
      expect(result.find((t) => t.language_code === "de")).toBeUndefined();
    });

    it("returns empty array when no supported languages", () => {
      const result = syncTranslationsWithLanguages(
        [{ language_code: "fr", name: "Test", description: "" }],
        []
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("Slug Field State (Req 3.3)", () => {
    it("slug is editable in create mode", () => {
      expect(isSlugDisabled("create")).toBe(false);
    });

    it("slug is disabled in edit mode", () => {
      expect(isSlugDisabled("edit")).toBe(true);
    });
  });

  describe("Submit Payload (Req 2.1, 3.2)", () => {
    const formData = {
      slug: "tower-defense",
      translations: [
        { language_code: "fr", name: "Défense de tour", description: "" },
        { language_code: "en", name: "Tower Defense", description: "Defend your base" },
      ],
    };

    it("includes slug in create payload", () => {
      const payload = buildSubmitPayload("create", formData);
      expect(payload).toEqual({
        slug: "tower-defense",
        translations: formData.translations,
      });
    });

    it("excludes slug in edit payload", () => {
      const payload = buildSubmitPayload("edit", formData);
      expect(payload).toEqual({
        translations: formData.translations,
      });
      expect("slug" in payload).toBe(false);
    });
  });
});
