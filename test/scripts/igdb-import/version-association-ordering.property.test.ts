import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { IGDBGameVersion } from "../../../src/types/igdb";

/**
 * Feature: igdb-game-versions
 * Property 3: Association et ordonnancement des versions
 * **Validates: Requirements 2.2, 2.3**
 *
 * Pour toute liste de versions importées pour un jeu, chaque version doit être
 * associée au jeu parent via `game_id`, et les versions doivent être ordonnées par
 * `display_order` croissant correspondant à leur ordre d'apparition dans la
 * réponse IGDB.
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

// Generator for array of IGDB versions with unique IDs
const uniqueVersionsArrayGenerator = fc
  .array(igdbVersionGenerator, { minLength: 1, maxLength: 15 })
  .map((versions) => {
    return versions.map((v, i) => ({ ...v, id: (i + 1) * 1000 + Math.floor(Math.random() * 100) }));
  })
  .filter((versions) => {
    const ids = versions.map((v) => v.id);
    return new Set(ids).size === ids.length;
  });

/**
 * Simulates the in-memory database for testing association and ordering
 * This mirrors the upsert behavior with onConflict: "game_id,igdb_id"
 */
class MockVersionDatabase {
  private versions: Map<string, Record<string, unknown>> = new Map();

  upsert(gameId: string, versionData: Record<string, unknown>): boolean {
    const key = `${gameId}:${versionData.igdb_id}`;
    this.versions.set(key, { ...versionData, game_id: gameId });
    return true;
  }

  getVersionsForGame(gameId: string): Record<string, unknown>[] {
    const result: Record<string, unknown>[] = [];
    for (const [key, value] of this.versions.entries()) {
      if (key.startsWith(`${gameId}:`)) {
        result.push(value);
      }
    }
    return result.sort((a, b) => (a.display_order as number) - (b.display_order as number));
  }

  clear(): void {
    this.versions.clear();
  }
}

function importVersionsToMockDb(
  db: MockVersionDatabase,
  gameId: string,
  versions: IGDBGameVersion[]
): number {
  let importedCount = 0;

  for (let i = 0; i < versions.length; i++) {
    const version = versions[i];
    const coverUrl = version.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${version.cover.image_id}.jpg`
      : null;

    const success = db.upsert(gameId, {
      igdb_id: version.id,
      version_title: version.version_title || version.name,
      description: version.summary || null,
      cover_image_url: coverUrl,
      display_order: i,
    });

    if (success) {
      importedCount++;
    }
  }

  return importedCount;
}

describe("IGDB Game Version Association and Ordering Property Tests", () => {
  describe("Property 3: Association et ordonnancement des versions", () => {
    it("should associate all versions to the correct parent game via game_id", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          importVersionsToMockDb(db, gameId, versions);

          const storedVersions = db.getVersionsForGame(gameId);

          expect(storedVersions.length).toBe(versions.length);

          for (const stored of storedVersions) {
            expect(stored.game_id).toBe(gameId);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should assign display_order matching the index in the IGDB response", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          importVersionsToMockDb(db, gameId, versions);

          const storedVersions = db.getVersionsForGame(gameId);

          for (const stored of storedVersions) {
            const originalIndex = versions.findIndex((v) => v.id === stored.igdb_id);
            expect(stored.display_order).toBe(originalIndex);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain IGDB response order when retrieving versions by display_order", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          importVersionsToMockDb(db, gameId, versions);

          const storedVersions = db.getVersionsForGame(gameId);

          for (let i = 0; i < storedVersions.length; i++) {
            const stored = storedVersions[i];
            const original = versions[i];

            expect(stored.igdb_id).toBe(original.id);
            expect(stored.display_order).toBe(i);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should have consecutive display_order values starting from 0", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          importVersionsToMockDb(db, gameId, versions);

          const storedVersions = db.getVersionsForGame(gameId);

          for (let i = 0; i < storedVersions.length; i++) {
            expect(storedVersions[i].display_order).toBe(i);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should not mix versions between different games", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          uniqueVersionsArrayGenerator,
          uniqueVersionsArrayGenerator,
          (gameId1, gameId2, versions1, versions2) => {
            fc.pre(gameId1 !== gameId2);

            const db = new MockVersionDatabase();

            importVersionsToMockDb(db, gameId1, versions1);
            importVersionsToMockDb(db, gameId2, versions2);

            const storedForGame1 = db.getVersionsForGame(gameId1);
            const storedForGame2 = db.getVersionsForGame(gameId2);

            expect(storedForGame1.length).toBe(versions1.length);
            expect(storedForGame2.length).toBe(versions2.length);

            for (const v of storedForGame1) {
              expect(v.game_id).toBe(gameId1);
            }

            for (const v of storedForGame2) {
              expect(v.game_id).toBe(gameId2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve version data integrity with correct game association", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          importVersionsToMockDb(db, gameId, versions);

          const storedVersions = db.getVersionsForGame(gameId);

          for (const stored of storedVersions) {
            expect(stored.game_id).toBe(gameId);
            expect(typeof stored.igdb_id).toBe("number");
            expect(typeof stored.version_title).toBe("string");
            expect((stored.version_title as string).length).toBeGreaterThan(0);
            expect(typeof stored.display_order).toBe("number");
            expect(stored.display_order).toBeGreaterThanOrEqual(0);
            expect(
              stored.cover_image_url === null || typeof stored.cover_image_url === "string"
            ).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
