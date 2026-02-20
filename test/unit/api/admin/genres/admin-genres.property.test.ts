/**
 * Feature: admin-genre-management, Property 9: Rejet des données invalides par l'API
 *
 * _Pour tout_ payload ne respectant pas le schéma de validation (slug invalide,
 * traductions manquantes, nom vide, description trop longue), l'API de création
 * doit retourner un code 400.
 *
 * **Validates: Requirements 5.2**
 *
 * Placed in test/isolated/ because vi.mock() conflicts with parallel tests.
 */

import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

// --- Mock setup (same pattern as genres-slug.test.ts) ---

vi.mock("../../../../../src/lib/auth-admin", () => ({
  requireAdmin: () => Promise.resolve(true),
}));

vi.mock("../../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: () => ({}),
    }),
}));

const { POST } = await import("../../../../../src/app/api/admin/genres/route");

function makePostRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/genres", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Generators for invalid payloads ---

/** Valid slug for isolating translation-related failures */
const validSlug = fc.constantFrom("action", "rpg", "tower-defense", "ab");

/** Valid language code */
const validLangCode = fc.constantFrom("fr", "en", "de", "es", "ja");

// -- Invalid slug generators --

/** Slug too short (0-1 chars) */
const tooShortSlug = fc.oneof(
  fc.constant(""),
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
);

/** Slug too long (51+ chars) */
const tooLongSlug = fc
  .integer({ min: 51, max: 80 })
  .chain((len) =>
    fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")), {
        minLength: len - 1,
        maxLength: len - 1,
      })
      .map((chars) => `a${chars.join("")}`)
  );

/** Slug starting with digit or hyphen */
const invalidStartSlug = fc
  .tuple(fc.constantFrom(..."0123456789-".split("")), fc.stringMatching(/^[a-z0-9]{1,10}$/))
  .map(([start, rest]) => `${start}${rest}`)
  .filter((s) => s.length >= 2 && s.length <= 50);

/** Slug with uppercase letters */
const uppercaseSlug = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/)
  )
  .map(([first, upper, rest]) => `${first}${upper}${rest}`)
  .filter((s) => s.length >= 2 && s.length <= 50);

/** Slug ending with hyphen */
const hyphenEndSlug = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/)
  )
  .map(([first, mid]) => `${first}${mid}-`)
  .filter((s) => s.length >= 2 && s.length <= 50);

/** Any invalid slug */
const invalidSlug = fc.oneof(
  tooShortSlug,
  tooLongSlug,
  invalidStartSlug,
  uppercaseSlug,
  hyphenEndSlug
);

/** Valid translation generator for isolating slug failures */
const validTranslation = fc
  .tuple(validLangCode, fc.stringMatching(/^[a-zA-Z]{1,50}$/))
  .map(([lang, name]) => ({
    language_code: lang,
    name,
    description: "",
  }));

/** Name too long (> 100 chars), using only printable ASCII to avoid edge cases */
const tooLongName = fc.stringMatching(/^[a-zA-Z]{101,150}$/);

/** Description too long (> 500 chars), using only printable ASCII */
const tooLongDescription = fc.stringMatching(/^[a-zA-Z]{501,600}$/);

// --- Tests ---

describe("Admin Genres API - Property-Based Tests", () => {
  // Feature: admin-genre-management, Property 9: Rejet des données invalides par l'API
  describe("Property 9: Rejet des données invalides par l'API", () => {
    it("rejects payloads with invalid slugs", async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidSlug,
          fc.array(validTranslation, { minLength: 1, maxLength: 3 }),
          async (slug, translations) => {
            const res = await POST(makePostRequest({ slug, translations }));
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe("Invalid input data");
            expect(body.details).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with empty translations array", async () => {
      await fc.assert(
        fc.asyncProperty(validSlug, async (slug) => {
          const res = await POST(makePostRequest({ slug, translations: [] }));
          expect(res.status).toBe(400);
          const body = await res.json();
          expect(body.error).toBe("Invalid input data");
        }),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with missing translations field", async () => {
      await fc.assert(
        fc.asyncProperty(validSlug, async (slug) => {
          const res = await POST(makePostRequest({ slug }));
          expect(res.status).toBe(400);
          const body = await res.json();
          expect(body.error).toBe("Invalid input data");
        }),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with empty name in translation", async () => {
      await fc.assert(
        fc.asyncProperty(validSlug, validLangCode, async (slug, langCode) => {
          const res = await POST(
            makePostRequest({
              slug,
              translations: [{ language_code: langCode, name: "", description: "" }],
            })
          );
          expect(res.status).toBe(400);
          const body = await res.json();
          expect(body.error).toBe("Invalid input data");
        }),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with name exceeding 100 characters", async () => {
      await fc.assert(
        fc.asyncProperty(validSlug, validLangCode, tooLongName, async (slug, langCode, name) => {
          const res = await POST(
            makePostRequest({
              slug,
              translations: [{ language_code: langCode, name, description: "" }],
            })
          );
          expect(res.status).toBe(400);
          const body = await res.json();
          expect(body.error).toBe("Invalid input data");
        }),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with description exceeding 500 characters", async () => {
      await fc.assert(
        fc.asyncProperty(
          validSlug,
          validLangCode,
          tooLongDescription,
          async (slug, langCode, description) => {
            const res = await POST(
              makePostRequest({
                slug,
                translations: [{ language_code: langCode, name: "Valid", description }],
              })
            );
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe("Invalid input data");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with missing slug", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validTranslation, { minLength: 1, maxLength: 3 }),
          async (translations) => {
            const res = await POST(makePostRequest({ translations }));
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe("Invalid input data");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
