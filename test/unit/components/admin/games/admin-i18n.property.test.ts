import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: admin-game-management, Property 6: Support de l'Internationalisation
 * Pour toute locale supportée (fr, en), tous les textes de l'interface admin
 * doivent être traduits dans cette locale.
 * **Validates: Requirements 2.5**
 */

import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const SUPPORTED_LOCALES = ["fr", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const messages: Record<SupportedLocale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
};

// All required admin translation keys used by admin components
const REQUIRED_ADMIN_KEYS = [
  // AdminLayout & AdminSidebar (admin.*)
  "admin.title",
  "admin.forbidden",
  "admin.backToDashboard",
  "admin.roles.admin",
  "admin.roles.contributor",
  "admin.nav.games",
  "admin.closeSidebar",
  "admin.lightMode",
  "admin.darkMode",
  // AdminGamesTable & games list page (admin.games.*)
  "admin.games.title",
  "admin.games.newGame",
  "admin.games.searchPlaceholder",
  "admin.games.search",
  "admin.games.totalGames",
  "admin.games.noGames",
  "admin.games.columns.image",
  "admin.games.columns.title",
  "admin.games.columns.releaseDate",
  "admin.games.columns.updatedAt",
  "admin.games.columns.actions",
  "admin.games.sortBy",
  "admin.games.editGame",
  "admin.games.deleteGame",
  "admin.games.page",
  "admin.games.previousPage",
  "admin.games.nextPage",
  // GameForm (admin.games.form.*)
  "admin.games.form.slug",
  "admin.games.form.slugPlaceholder",
  "admin.games.form.translations",
  "admin.games.form.addTranslation",
  "admin.games.form.removeTranslation",
  "admin.games.form.title",
  "admin.games.form.titlePlaceholder",
  "admin.games.form.description",
  "admin.games.form.descriptionPlaceholder",
  "admin.games.form.coverImage",
  "admin.games.form.coverImagePlaceholder",
  "admin.games.form.releaseDate",
  "admin.games.form.genres",
  "admin.games.form.companies",
  "admin.games.form.noCompanies",
  "admin.games.form.developer",
  "admin.games.form.publisher",
  "admin.games.form.create",
  "admin.games.form.save",
  "admin.games.form.backToList",
  // Create page (admin.games.createPage.*)
  "admin.games.createPage.title",
  "admin.games.createPage.success",
  "admin.games.createPage.errorDuplicate",
  "admin.games.createPage.errorGeneric",
  // Edit page (admin.games.editPage.*)
  "admin.games.editPage.title",
  "admin.games.editPage.loading",
  "admin.games.editPage.notFound",
  "admin.games.editPage.loadError",
  "admin.games.editPage.success",
  "admin.games.editPage.errorGeneric",
  // Delete dialog (admin.games.deleteDialog.*)
  "admin.games.deleteDialog.title",
  "admin.games.deleteDialog.warning",
  "admin.games.deleteDialog.irreversible",
  "admin.games.deleteDialog.confirm",
  "admin.games.deleteDialog.cancel",
  "admin.games.deleteDialog.deleting",
  "admin.games.deleteDialog.success",
  "admin.games.deleteDialog.errorGeneric",
] as const;

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

function translationExists(locale: SupportedLocale, key: string): boolean {
  const value = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key);
  return typeof value === "string" && value.length > 0;
}

function getTranslation(locale: SupportedLocale, key: string): string | undefined {
  const value = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key);
  return typeof value === "string" ? value : undefined;
}

const localeArb = fc.constantFrom<SupportedLocale>("fr", "en");
const keyArb = fc.constantFrom(...REQUIRED_ADMIN_KEYS);

describe("Admin i18n Property-Based Tests", () => {
  describe("Property 6: Support de l'Internationalisation", () => {
    it("all required admin translation keys exist for every supported locale", () => {
      fc.assert(
        fc.property(localeArb, keyArb, (locale, key) => {
          expect(translationExists(locale, key)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("translations are non-empty strings for all required keys", () => {
      fc.assert(
        fc.property(localeArb, keyArb, (locale, key) => {
          const translation = getTranslation(locale, key);
          expect(translation).toBeDefined();
          expect(translation!.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("French and English translations differ for most keys (real localization)", () => {
      const keysToCheck = [
        "admin.title",
        "admin.forbidden",
        "admin.backToDashboard",
        "admin.roles.admin",
        "admin.roles.contributor",
        "admin.closeSidebar",
        "admin.games.title",
        "admin.games.newGame",
        "admin.games.searchPlaceholder",
        "admin.games.noGames",
        "admin.games.form.create",
        "admin.games.form.save",
        "admin.games.deleteDialog.title",
        "admin.games.deleteDialog.irreversible",
      ];

      let differentCount = 0;
      for (const key of keysToCheck) {
        const frValue = getTranslation("fr", key);
        const enValue = getTranslation("en", key);
        if (frValue !== enValue) differentCount++;
      }

      expect(differentCount).toBeGreaterThanOrEqual(Math.floor(keysToCheck.length * 0.8));
    });

    it("both locales have the same set of admin keys", () => {
      fc.assert(
        fc.property(keyArb, (key) => {
          const frExists = translationExists("fr", key);
          const enExists = translationExists("en", key);
          expect(frExists).toBe(enExists);
          expect(frExists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("translations with placeholders contain placeholder syntax in both locales", () => {
      const keysWithPlaceholders = [
        "admin.games.totalGames",
        "admin.games.sortBy",
        "admin.games.editGame",
        "admin.games.deleteGame",
        "admin.games.page",
        "admin.games.deleteDialog.warning",
      ];

      for (const key of keysWithPlaceholders) {
        for (const locale of SUPPORTED_LOCALES) {
          const translation = getTranslation(locale, key);
          expect(translation).toBeDefined();
          expect(translation).toMatch(/\{[a-zA-Z_,\s|#=]+\}/);
        }
      }
    });
  });
});
