import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

/**
 * Feature: admin-language-management, Property 7: Support de l'Internationalisation
 *
 * _For any_ supported locale (fr, en), all translation keys for the admin
 * languages interface must exist in that locale.
 *
 * **Validates: Requirements 2.4**
 */

// --- Helpers ---

const MESSAGES_DIR = path.resolve(__dirname, "../../../../src/messages");
const SUPPORTED_LOCALES = ["fr", "en"] as const;

type Messages = Record<string, unknown>;

function loadMessages(locale: string): Messages {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as Messages;
}

/**
 * Recursively extracts all leaf key paths from a nested object.
 * E.g. { a: { b: "x", c: "y" } } => ["a.b", "a.c"]
 */
function extractKeyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return [prefix];
  }
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...extractKeyPaths(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Resolves a dot-separated key path against a nested object.
 * Returns undefined if any segment is missing.
 */
function resolveKeyPath(obj: unknown, keyPath: string): unknown {
  const segments = keyPath.split(".");
  let current: unknown = obj;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

// --- Load messages once ---

const messagesByLocale = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, loadMessages(locale)])
);

// Extract admin.languages keys from each locale
const adminLanguagesKeysByLocale = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => {
    const adminLanguages = resolveKeyPath(messagesByLocale[locale], "admin.languages");
    return [locale, extractKeyPaths(adminLanguages, "admin.languages")];
  })
);

// Also check admin.nav.languages
const adminNavLanguagesKeysByLocale = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => {
    const navLanguages = resolveKeyPath(messagesByLocale[locale], "admin.nav.languages");
    return [locale, navLanguages !== undefined];
  })
);

// Union of all admin.languages keys across all locales
const allAdminLanguagesKeys = [
  ...new Set(SUPPORTED_LOCALES.flatMap((locale) => adminLanguagesKeysByLocale[locale])),
].sort();

// --- Tests ---

describe("Admin Languages i18n - Property-Based Tests", () => {
  describe("Property 7: Support de l'Internationalisation", () => {
    it("admin.nav.languages key exists in all supported locales", () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(adminNavLanguagesKeysByLocale[locale]).toBe(true);
      }
    });

    it("all admin.languages keys exist in every supported locale", () => {
      // Deterministic check: every key from the union must exist in every locale
      for (const locale of SUPPORTED_LOCALES) {
        const localeKeys = new Set(adminLanguagesKeysByLocale[locale]);
        for (const key of allAdminLanguagesKeys) {
          expect(localeKeys.has(key)).toBe(true);
        }
      }
    });

    it("fr and en have the exact same set of admin.languages keys", () => {
      const frKeys = [...adminLanguagesKeysByLocale["fr"]].sort();
      const enKeys = [...adminLanguagesKeysByLocale["en"]].sort();
      expect(frKeys).toEqual(enKeys);
    });

    it("randomly selected admin.languages keys resolve to non-empty strings in both locales", () => {
      // Property-based: pick random keys from the union and verify they exist
      // with non-undefined, non-empty string values in both locales
      const keyArbitrary = fc.constantFrom(...allAdminLanguagesKeys);

      fc.assert(
        fc.property(keyArbitrary, (keyPath) => {
          for (const locale of SUPPORTED_LOCALES) {
            const value = resolveKeyPath(messagesByLocale[locale], keyPath);
            expect(value).toBeDefined();
            expect(typeof value).toBe("string");
            expect((value as string).length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("randomly selected subsets of keys all exist in both locales", () => {
      // Property-based: generate random subsets of keys and verify parity
      const subsetArbitrary = fc.shuffledSubarray(allAdminLanguagesKeys, {
        minLength: 1,
        maxLength: Math.min(allAdminLanguagesKeys.length, 20),
      });

      fc.assert(
        fc.property(subsetArbitrary, (subset) => {
          for (const keyPath of subset) {
            for (const locale of SUPPORTED_LOCALES) {
              const value = resolveKeyPath(messagesByLocale[locale], keyPath);
              expect(value).toBeDefined();
              expect(typeof value).toBe("string");
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
