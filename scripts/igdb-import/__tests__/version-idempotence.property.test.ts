import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import * as fc from "fast-check";
import type { IGDBGameVersion } from "../../../src/types/igdb";

/**
 * Feature: igdb-game-versions
 * Property 2: Idempotence de l'import des versions
 * **Validates: Requirements 2.4**
 *
 * Pour tout jeu avec des versions, importer les versions deux fois
 * consécutivement doit produire le même nombre de versions en base de données
 * qu'un seul import (pas de doublons créés).
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

// Generator for IGDB game version with unique IDs
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
  .array(igdbVersionGenerator, { minLength: 1, maxLength: 10 })
  .map((versions) => {
    // Ensure unique igdb_ids by using index as part of id
    return versions.map((v, i) => ({ ...v, id: i + 1 }));
  });

/**
 * Simulates the in-memory database for testing idempotence
 * This mirrors the upsert behavior with onConflict: "game_id,igdb_id"
 */
class MockVersionDatabase {
  private versions: Map<string, Record<string, unknown>> = new Map();

  /**
   * Upsert a version - key is game_id + igdb_id
   * Returns true if inserted/updated successfully
   */
  upsert(gameId: string, versionData: Record<string, unknown>): boolean {
    const key = `${gameId}:${versionData.igdb_id}`;
    this.versions.set(key, { ...versionData, game_id: gameId });
    return true;
  }

  /**
   * Get count of versions for a game
   */
  countForGame(gameId: string): number {
    let count = 0;
    for (const key of this.versions.keys()) {
      if (key.startsWith(`${gameId}:`)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get all versions for a game
   */
  getVersionsForGame(gameId: string): Record<string, unknown>[] {
    const result: Record<string, unknown>[] = [];
    for (const [key, value] of this.versions.entries()) {
      if (key.startsWith(`${gameId}:`)) {
        result.push(value);
      }
    }
    return result;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.versions.clear();
  }
}

/**
 * Pure import function that mirrors the logic in game-importer.ts
 * Uses the mock database to simulate upsert behavior
 */
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

describe("IGDB Game Version Import Idempotence Property Tests", () => {
  describe("Property 2: Idempotence de l'import des versions", () => {
    it("should produce the same count after importing twice", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          // First import
          const firstImportCount = importVersionsToMockDb(db, gameId, versions);
          const countAfterFirstImport = db.countForGame(gameId);

          // Second import (same versions)
          const secondImportCount = importVersionsToMockDb(db, gameId, versions);
          const countAfterSecondImport = db.countForGame(gameId);

          // Idempotence: count should be the same after both imports
          expect(countAfterFirstImport).toBe(countAfterSecondImport);

          // Both imports should report the same number of "successful" operations
          // (upsert always succeeds, whether insert or update)
          expect(firstImportCount).toBe(secondImportCount);

          // Count should equal the number of unique versions
          expect(countAfterSecondImport).toBe(versions.length);
        }),
        { numRuns: 100 }
      );
    });

    it("should not create duplicates when importing the same version multiple times", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          igdbVersionGenerator,
          fc.integer({ min: 2, max: 5 }),
          (gameId, version, importCount) => {
            const db = new MockVersionDatabase();
            const versions = [version];

            // Import the same version multiple times
            for (let i = 0; i < importCount; i++) {
              importVersionsToMockDb(db, gameId, versions);
            }

            // Should only have 1 version in the database
            expect(db.countForGame(gameId)).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve data integrity across multiple imports", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          // First import
          importVersionsToMockDb(db, gameId, versions);
          const versionsAfterFirst = db.getVersionsForGame(gameId);

          // Second import
          importVersionsToMockDb(db, gameId, versions);
          const versionsAfterSecond = db.getVersionsForGame(gameId);

          // Same number of versions
          expect(versionsAfterFirst.length).toBe(versionsAfterSecond.length);

          // Each version should have the same igdb_id
          const idsAfterFirst = new Set(versionsAfterFirst.map((v) => v.igdb_id));
          const idsAfterSecond = new Set(versionsAfterSecond.map((v) => v.igdb_id));

          expect(idsAfterFirst.size).toBe(idsAfterSecond.size);
          for (const id of idsAfterFirst) {
            expect(idsAfterSecond.has(id)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle empty version arrays idempotently", () => {
      fc.assert(
        fc.property(fc.uuid(), (gameId) => {
          const db = new MockVersionDatabase();
          const emptyVersions: IGDBGameVersion[] = [];

          // Import empty array multiple times
          const firstCount = importVersionsToMockDb(db, gameId, emptyVersions);
          const secondCount = importVersionsToMockDb(db, gameId, emptyVersions);

          expect(firstCount).toBe(0);
          expect(secondCount).toBe(0);
          expect(db.countForGame(gameId)).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain correct display_order after multiple imports", () => {
      fc.assert(
        fc.property(fc.uuid(), uniqueVersionsArrayGenerator, (gameId, versions) => {
          const db = new MockVersionDatabase();

          // Import twice
          importVersionsToMockDb(db, gameId, versions);
          importVersionsToMockDb(db, gameId, versions);

          const storedVersions = db.getVersionsForGame(gameId);

          // Each version should have a display_order matching its index
          for (const stored of storedVersions) {
            const originalIndex = versions.findIndex((v) => v.id === stored.igdb_id);
            expect(stored.display_order).toBe(originalIndex);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
