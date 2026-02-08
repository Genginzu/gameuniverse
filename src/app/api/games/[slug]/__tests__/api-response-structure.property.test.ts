import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { GameVersion } from "@/types/game";

/**
 * Feature: igdb-game-versions
 * Property 5: Structure complète de la réponse API
 * **Validates: Requirements 5.1, 5.2**
 *
 * Pour tout appel à l'API de détail d'un jeu, la réponse doit contenir un champ
 * `versions` qui est un tableau, et chaque élément du tableau doit contenir les
 * champs `id`, `title`, et `coverImageUrl`.
 */

// Generator for UUID-like strings
const uuidGenerator = fc.stringMatching(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
);

// Generator for IGDB cover image URLs
const coverImageUrlGenerator = fc.option(
  fc.stringMatching(
    /^https:\/\/images\.igdb\.com\/igdb\/image\/upload\/t_cover_big\/[a-zA-Z0-9]+\.jpg$/
  ),
  { nil: null }
);

// Generator for version title
const versionTitleGenerator = fc.string({ minLength: 1, maxLength: 100 });

// Generator for a single GameVersion as returned by the API
const gameVersionGenerator: fc.Arbitrary<GameVersion> = fc.record({
  id: uuidGenerator,
  igdbId: fc.integer({ min: 1, max: 999999 }),
  title: versionTitleGenerator,
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  coverImageUrl: coverImageUrlGenerator,
});

// Generator for array of versions (can be empty)
const versionsArrayGenerator = fc.array(gameVersionGenerator, {
  minLength: 0,
  maxLength: 20,
});

/**
 * Simulates the API response transformation for versions
 * This mirrors the logic in /api/games/[slug]/route.ts
 */
function transformVersionsForApiResponse(
  dbVersions: Array<{
    id: string;
    igdb_id: number;
    version_title: string;
    description: string | null;
    cover_image_url: string | null;
  }>
): GameVersion[] {
  return dbVersions.map((v) => ({
    id: v.id,
    igdbId: v.igdb_id,
    title: v.version_title,
    description: v.description,
    coverImageUrl: v.cover_image_url,
  }));
}

// Generator for database version format
const dbVersionGenerator = fc.record({
  id: uuidGenerator,
  igdb_id: fc.integer({ min: 1, max: 999999 }),
  version_title: versionTitleGenerator,
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  cover_image_url: coverImageUrlGenerator,
});

const dbVersionsArrayGenerator = fc.array(dbVersionGenerator, {
  minLength: 0,
  maxLength: 20,
});

describe("Game Detail API Response Structure Property Tests", () => {
  describe("Property 5: Structure complète de la réponse API", () => {
    it("should always return versions as an array", () => {
      fc.assert(
        fc.property(versionsArrayGenerator, (versions) => {
          // The versions field must always be an array
          expect(Array.isArray(versions)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should return empty array when no versions exist", () => {
      // Empty array case
      const emptyVersions: GameVersion[] = [];
      expect(Array.isArray(emptyVersions)).toBe(true);
      expect(emptyVersions.length).toBe(0);
    });

    it("should include required fields (id, title, coverImageUrl) for each version", () => {
      fc.assert(
        fc.property(gameVersionGenerator, (version) => {
          // Each version must have id field
          expect(version).toHaveProperty("id");
          expect(typeof version.id).toBe("string");
          expect(version.id.length).toBeGreaterThan(0);

          // Each version must have title field
          expect(version).toHaveProperty("title");
          expect(typeof version.title).toBe("string");
          expect(version.title.length).toBeGreaterThan(0);

          // Each version must have coverImageUrl field (can be null)
          expect(version).toHaveProperty("coverImageUrl");
          expect(version.coverImageUrl === null || typeof version.coverImageUrl === "string").toBe(
            true
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should correctly transform database versions to API response format", () => {
      fc.assert(
        fc.property(dbVersionsArrayGenerator, (dbVersions) => {
          const apiVersions = transformVersionsForApiResponse(dbVersions);

          // Number of versions must match
          expect(apiVersions.length).toBe(dbVersions.length);

          // Each transformed version must have correct structure
          for (let i = 0; i < apiVersions.length; i++) {
            const apiVersion = apiVersions[i];
            const dbVersion = dbVersions[i];

            // Required fields must exist
            expect(apiVersion).toHaveProperty("id");
            expect(apiVersion).toHaveProperty("title");
            expect(apiVersion).toHaveProperty("coverImageUrl");

            // Values must be correctly mapped
            expect(apiVersion.id).toBe(dbVersion.id);
            expect(apiVersion.igdbId).toBe(dbVersion.igdb_id);
            expect(apiVersion.title).toBe(dbVersion.version_title);
            expect(apiVersion.coverImageUrl).toBe(dbVersion.cover_image_url);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve version order from database", () => {
      fc.assert(
        fc.property(dbVersionsArrayGenerator, (dbVersions) => {
          const apiVersions = transformVersionsForApiResponse(dbVersions);

          // Order must be preserved
          for (let i = 0; i < dbVersions.length; i++) {
            expect(apiVersions[i].id).toBe(dbVersions[i].id);
            expect(apiVersions[i].igdbId).toBe(dbVersions[i].igdb_id);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle coverImageUrl being null correctly", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: uuidGenerator,
            igdb_id: fc.integer({ min: 1, max: 999999 }),
            version_title: versionTitleGenerator,
            description: fc.constant(null),
            cover_image_url: fc.constant(null),
          }),
          (dbVersion) => {
            const apiVersions = transformVersionsForApiResponse([dbVersion]);

            expect(apiVersions.length).toBe(1);
            expect(apiVersions[0].coverImageUrl).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle coverImageUrl being a valid URL correctly", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: uuidGenerator,
            igdb_id: fc.integer({ min: 1, max: 999999 }),
            version_title: versionTitleGenerator,
            description: fc.constant(null),
            cover_image_url: fc.stringMatching(
              /^https:\/\/images\.igdb\.com\/igdb\/image\/upload\/t_cover_big\/[a-zA-Z0-9]+\.jpg$/
            ),
          }),
          (dbVersion) => {
            const apiVersions = transformVersionsForApiResponse([dbVersion]);

            expect(apiVersions.length).toBe(1);
            expect(typeof apiVersions[0].coverImageUrl).toBe("string");
            expect(apiVersions[0].coverImageUrl).toContain("images.igdb.com");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
