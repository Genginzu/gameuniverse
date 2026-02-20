import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: player-pages
 * Property 8: Internationalisation
 * **Validates: Requirements 8.1, 8.3, 8.4**
 *
 * Pour toute locale supportée ('fr', 'en') et pour tout texte de l'interface,
 * une traduction doit exister. De plus, pour tout jeu affiché, le titre doit
 * correspondre à la traduction dans la locale demandée.
 */

// Import translation files
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

// Supported locales
const SUPPORTED_LOCALES = ["fr", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Translation messages by locale
const messages: Record<SupportedLocale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
};

// All required translation keys for the players feature
const REQUIRED_PLAYER_KEYS = [
  "players.title",
  "players.heroTitle",
  "players.heroTitleHighlight",
  "players.heroSubtitle",
  "players.availableCount",
  "players.searchPlaceholder",
  "players.searchingFor",
  "players.filters.title",
  "players.filters.byGameCount",
  "players.filters.active",
  "players.filters.selected",
  "players.filters.clearAll",
  "players.filters.clear",
  "players.filters.filter",
  "players.gameCountRanges.0",
  "players.gameCountRanges.1-5",
  "players.gameCountRanges.6-20",
  "players.gameCountRanges.20+",
  "players.results.count",
  "players.results.forQuery",
  "players.results.total",
  "players.results.activeFilters",
  "players.card.games",
  "players.card.anonymousPlayer",
  "players.card.viewProfile",
  "players.details.back",
  "players.details.memberSince",
  "players.details.totalGames",
  "players.details.completedGames",
  "players.details.totalPlayTime",
  "players.details.averageRating",
  "players.details.noRating",
  "players.details.library",
  "players.details.inLibrary",
  "players.library.empty",
  "players.library.emptyDescription",
  "players.library.status.owned",
  "players.library.status.wishlist",
  "players.library.status.completed",
  "players.library.status.playing",
  "players.empty.title",
  "players.empty.description",
  "players.empty.noPlayers",
  "players.empty.clearFilters",
  "players.errors.loadingTitle",
  "players.errors.loadingDescription",
  "players.errors.detailsLoadingDescription",
  "players.errors.unableToLoad",
  "players.errors.retry",
  "players.errors.backToPlayers",
  "players.errors.backToHome",
  "players.errors.notFoundTitle",
  "players.errors.notFoundDescription",
  "players.errors.loadingToast",
  "players.errors.loadingToastDescription",
  "players.pagination.page",
  "players.pagination.of",
  "players.pagination.result",
  "players.pagination.results",
  "players.pagination.goToPage",
  "players.pagination.first",
  "players.pagination.previous",
  "players.pagination.next",
  "players.pagination.last",
] as const;

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Check if a translation key exists and has a non-empty string value
 */
function translationExists(locale: SupportedLocale, key: string): boolean {
  const value = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key);
  return typeof value === "string" && value.length > 0;
}

/**
 * Get translation value for a key
 */
function getTranslation(locale: SupportedLocale, key: string): string | undefined {
  const value = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key);
  return typeof value === "string" ? value : undefined;
}

// Generators
const localeArbitrary = fc.constantFrom<SupportedLocale>("fr", "en");
const translationKeyArbitrary = fc.constantFrom(...REQUIRED_PLAYER_KEYS);

describe("Player i18n Property-Based Tests", () => {
  describe("Property 8: Internationalisation", () => {
    it("all required player translation keys exist for every supported locale", () => {
      fc.assert(
        fc.property(localeArbitrary, translationKeyArbitrary, (locale, key) => {
          const exists = translationExists(locale, key);
          expect(exists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("translations are non-empty strings for all required keys", () => {
      fc.assert(
        fc.property(localeArbitrary, translationKeyArbitrary, (locale, key) => {
          const translation = getTranslation(locale, key);
          expect(translation).toBeDefined();
          expect(typeof translation).toBe("string");
          expect(translation!.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("French and English translations are different for most keys (localization is real)", () => {
      // Keys that should have different translations between locales
      const keysToCheck = [
        "players.title",
        "players.heroTitle",
        "players.searchPlaceholder",
        "players.details.back",
        "players.details.memberSince",
        "players.empty.title",
        "players.errors.loadingTitle",
        "players.pagination.previous",
        "players.pagination.next",
      ];

      let differentCount = 0;
      for (const key of keysToCheck) {
        const frValue = getTranslation("fr", key);
        const enValue = getTranslation("en", key);

        if (frValue !== enValue) {
          differentCount++;
        }
      }

      // At least 80% of checked keys should have different translations
      expect(differentCount).toBeGreaterThanOrEqual(Math.floor(keysToCheck.length * 0.8));
    });

    it("game count range translations exist for all ranges in both locales", () => {
      const ranges = ["0", "1-5", "6-20", "20+"];

      fc.assert(
        fc.property(localeArbitrary, fc.constantFrom(...ranges), (locale, range) => {
          const key = `players.gameCountRanges.${range}`;
          const exists = translationExists(locale, key);
          expect(exists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("library status translations exist for all statuses in both locales", () => {
      const statuses = ["owned", "wishlist", "completed", "playing"];

      fc.assert(
        fc.property(localeArbitrary, fc.constantFrom(...statuses), (locale, status) => {
          const key = `players.library.status.${status}`;
          const exists = translationExists(locale, key);
          expect(exists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("error message translations exist for all error types in both locales", () => {
      const errorKeys = [
        "players.errors.loadingTitle",
        "players.errors.loadingDescription",
        "players.errors.detailsLoadingDescription",
        "players.errors.unableToLoad",
        "players.errors.retry",
        "players.errors.backToPlayers",
        "players.errors.backToHome",
        "players.errors.notFoundTitle",
        "players.errors.notFoundDescription",
      ];

      fc.assert(
        fc.property(localeArbitrary, fc.constantFrom(...errorKeys), (locale, key) => {
          const exists = translationExists(locale, key);
          expect(exists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("pagination translations exist for all pagination elements in both locales", () => {
      const paginationKeys = [
        "players.pagination.page",
        "players.pagination.of",
        "players.pagination.result",
        "players.pagination.results",
        "players.pagination.goToPage",
        "players.pagination.first",
        "players.pagination.previous",
        "players.pagination.next",
        "players.pagination.last",
      ];

      fc.assert(
        fc.property(localeArbitrary, fc.constantFrom(...paginationKeys), (locale, key) => {
          const exists = translationExists(locale, key);
          expect(exists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("translations with placeholders contain the placeholder syntax", () => {
      // Keys that should contain {count} or similar placeholders
      const keysWithPlaceholders = [
        "players.availableCount",
        "players.filters.selected",
        "players.results.count",
        "players.results.forQuery",
        "players.results.total",
        "players.card.games",
      ];

      for (const key of keysWithPlaceholders) {
        for (const locale of SUPPORTED_LOCALES) {
          const translation = getTranslation(locale, key);
          expect(translation).toBeDefined();
          // Should contain at least one placeholder like {count} or {query}
          expect(translation).toMatch(/\{[a-zA-Z]+\}/);
        }
      }
    });

    it("locale switching produces consistent structure - same keys available", () => {
      fc.assert(
        fc.property(translationKeyArbitrary, (key) => {
          const frExists = translationExists("fr", key);
          const enExists = translationExists("en", key);

          // Both locales should have the same keys
          expect(frExists).toBe(enExists);
          expect(frExists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("all supported locales are defined in the messages object", () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(messages[locale]).toBeDefined();
        expect(typeof messages[locale]).toBe("object");
        expect(messages[locale].players).toBeDefined();
      }
    });
  });
});
