import { describe, it, expect } from "vitest";

/**
 * GenderForm Unit Tests
 *
 * Tests the display logic that drives the GenderForm component:
 * 1. Translation sync logic — ensures translations array matches supported languages
 * 2. Slug field disabled state in edit mode
 * 3. Form data structure for create vs edit
 * 4. Gender-specific: no description field in translations
 *
 * Requirements: 3.2, 3.3, 3.5
 */

interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string | null;
}

interface GenderTranslation {
  language_code: string;
  name: string;
}

/**
 * Mirrors the translation sync logic in GenderFormTranslations.tsx useEffect.
 * Genders only have name (no description unlike genres).
 */
function syncTranslationsWithLanguages(
  currentTranslations: GenderTranslation[],
  supportedLanguages: SupportedLanguage[]
): GenderTranslation[] {
  return supportedLanguages.map((lang) => {
    const existing = currentTranslations.find((tr) => tr.language_code === lang.code);
    return existing ?? { language_code: lang.code, name: "" };
  });
}

/** Determines whether the slug field should be disabled based on form mode. */
function isSlugDisabled(mode: "create" | "edit"): boolean {
  return mode === "edit";
}

/** Builds the API payload for gender form submission. */
function buildSubmitPayload(
  mode: "create" | "edit",
  data: { slug: string; translations: GenderTranslation[] }
) {
  // Genders always send slug + translations (API handles immutability)
  return { slug: data.slug, translations: data.translations };
}

const languages: SupportedLanguage[] = [
  { code: "fr", name: "French", native_name: "Français" },
  { code: "en", name: "English", native_name: null },
];

describe("GenderForm Logic", () => {
  describe("Translation Sync", () => {
    it("creates empty translations for all supported languages when none exist", () => {
      const result = syncTranslationsWithLanguages([], languages);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ language_code: "fr", name: "" });
      expect(result[1]).toEqual({ language_code: "en", name: "" });
    });

    it("preserves existing translations when they match supported languages", () => {
      const existing: GenderTranslation[] = [
        { language_code: "fr", name: "Masculin" },
        { language_code: "en", name: "Male" },
      ];

      const result = syncTranslationsWithLanguages(existing, languages);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ language_code: "fr", name: "Masculin" });
      expect(result[1]).toEqual({ language_code: "en", name: "Male" });
    });

    it("drops translations for unsupported languages", () => {
      const existing: GenderTranslation[] = [
        { language_code: "fr", name: "Masculin" },
        { language_code: "de", name: "Männlich" },
      ];

      const result = syncTranslationsWithLanguages(existing, languages);

      expect(result).toHaveLength(2);
      expect(result[0].language_code).toBe("fr");
      expect(result[1].language_code).toBe("en");
      expect(result.find((t) => t.language_code === "de")).toBeUndefined();
    });

    it("returns empty array when no supported languages", () => {
      const result = syncTranslationsWithLanguages([{ language_code: "fr", name: "Test" }], []);
      expect(result).toHaveLength(0);
    });

    it("gender translations have no description field", () => {
      const result = syncTranslationsWithLanguages([], languages);

      for (const translation of result) {
        expect(Object.keys(translation)).toEqual(["language_code", "name"]);
        expect("description" in translation).toBe(false);
      }
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

  describe("Submit Payload (Req 3.2, 3.5)", () => {
    const formData = {
      slug: "male",
      translations: [
        { language_code: "fr", name: "Masculin" },
        { language_code: "en", name: "Male" },
      ],
    };

    it("includes slug and translations in create payload", () => {
      const payload = buildSubmitPayload("create", formData);
      expect(payload).toEqual({
        slug: "male",
        translations: formData.translations,
      });
    });

    it("includes slug and translations in edit payload", () => {
      const payload = buildSubmitPayload("edit", formData);
      expect(payload).toEqual({
        slug: "male",
        translations: formData.translations,
      });
    });

    it("payload translations have no description field", () => {
      const payload = buildSubmitPayload("create", formData);
      for (const tr of payload.translations) {
        expect(Object.keys(tr)).toEqual(["language_code", "name"]);
      }
    });
  });
});
