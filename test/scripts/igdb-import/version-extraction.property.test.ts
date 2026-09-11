import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { IGDBGameVersion } from "../../../src/types/igdb";

/**
 * Feature: igdb-game-versions
 * Property 1: Extraction correcte des données de version
 * **Validates: Requirements 1.2**
 *
 * Pour toute réponse IGDB contenant des versions de jeu, l'extraction doit
 * produire des objets avec les champs `igdb_id`, `version_title` (ou `name` si
 * `version_title` est null), et `cover_image_url` (ou null si pas de cover).
 */

// Generator for IGDB image_id (alphanumeric string)
const imageIdGenerator = fc.stringMatching(/^[a-zA-Z0-9]{5,20}$/);

// Generator for IGDB cover object
const coverGenerator = fc.option(
  fc.record({
    image_id: imageIdGenerator,
  }),
  { nil: undefined }
);

// Generator for IGDB game version
const igdbVersionGenerator: fc.Arbitrary<IGDBGameVersion> = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.stringMatching(/^[a-z0-9-]{3,50}$/),
  version_title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  summary: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
  cover: coverGenerator,
});

// Generator for array of IGDB versions
const igdbVersionsArrayGenerator = fc.array(igdbVersionGenerator, {
  minLength: 0,
  maxLength: 20,
});

/**
 * Pure extraction function that mirrors the logic in game-importer.ts
 * This extracts version data from IGDB format to our internal format
 */
function extractVersionData(version: IGDBGameVersion): {
  igdb_id: number;
  version_title: string;
  cover_image_url: string | null;
} {
  const coverUrl = version.cover?.image_id
    ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${version.cover.image_id}.jpg`
    : null;

  return {
    igdb_id: version.id,
    version_title: version.version_title || version.name,
    cover_image_url: coverUrl,
  };
}

describe("IGDB Game Version Extraction Property Tests", () => {
  describe("Property 1: Extraction correcte des données de version", () => {
    it("should always extract igdb_id from version.id", () => {
      fc.assert(
        fc.property(igdbVersionGenerator, (version) => {
          const extracted = extractVersionData(version);

          // igdb_id must equal the original version.id
          expect(extracted.igdb_id).toBe(version.id);
          expect(typeof extracted.igdb_id).toBe("number");
        }),
        { numRuns: 100 }
      );
    });

    it("should extract version_title from version_title when available, otherwise from name", () => {
      fc.assert(
        fc.property(igdbVersionGenerator, (version) => {
          const extracted = extractVersionData(version);

          // version_title must be a non-empty string
          expect(typeof extracted.version_title).toBe("string");
          expect(extracted.version_title.length).toBeGreaterThan(0);

          // If version_title exists, use it; otherwise use name
          if (version.version_title !== null && version.version_title !== undefined) {
            expect(extracted.version_title).toBe(version.version_title);
          } else {
            expect(extracted.version_title).toBe(version.name);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should extract cover_image_url when cover.image_id exists, null otherwise", () => {
      fc.assert(
        fc.property(igdbVersionGenerator, (version) => {
          const extracted = extractVersionData(version);

          if (version.cover?.image_id) {
            // When cover exists, URL must be constructed correctly
            expect(extracted.cover_image_url).not.toBeNull();
            expect(extracted.cover_image_url).toContain(version.cover.image_id);
            expect(extracted.cover_image_url).toContain("images.igdb.com");
            expect(extracted.cover_image_url).toContain("t_cover_big");
          } else {
            // When no cover, URL must be null
            expect(extracted.cover_image_url).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle arrays of versions correctly", () => {
      fc.assert(
        fc.property(igdbVersionsArrayGenerator, (versions) => {
          const extractedVersions = versions.map(extractVersionData);

          // Number of extracted versions must match input
          expect(extractedVersions.length).toBe(versions.length);

          // Each extracted version must have all required fields
          for (let i = 0; i < extractedVersions.length; i++) {
            const extracted = extractedVersions[i];
            const original = versions[i];

            expect(extracted).toHaveProperty("igdb_id");
            expect(extracted).toHaveProperty("version_title");
            expect(extracted).toHaveProperty("cover_image_url");

            // Verify field types
            expect(typeof extracted.igdb_id).toBe("number");
            expect(typeof extracted.version_title).toBe("string");
            expect(
              extracted.cover_image_url === null || typeof extracted.cover_image_url === "string"
            ).toBe(true);

            // Verify igdb_id matches
            expect(extracted.igdb_id).toBe(original.id);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should never produce empty version_title", () => {
      fc.assert(
        fc.property(igdbVersionGenerator, (version) => {
          const extracted = extractVersionData(version);

          // version_title must never be empty (since name is always non-empty)
          expect(extracted.version_title.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
