import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 8: Statistics calculation correctness
 * **Validates: Requirements 3.1**
 *
 * For any user library, the calculated statistics (total games, completed games,
 * total play time, average rating) should accurately reflect the sum/average of
 * the corresponding values across all library entries.
 */

// Types representing the domain
interface LibraryEntry {
  gameId: string;
  userId: string;
  status: "owned" | "playing" | "completed" | "wishlist";
  playTimeHours: number;
  rating: number | null;
}

interface LibraryStats {
  totalGames: number;
  ownedGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating: number | null;
}

// Pure function that calculates library statistics from entries
// This mirrors the database function get_user_library_stats
function calculateLibraryStats(libraryEntries: LibraryEntry[]): LibraryStats {
  if (libraryEntries.length === 0) {
    return {
      totalGames: 0,
      ownedGames: 0,
      completedGames: 0,
      totalPlayTime: 0,
      averageRating: null,
    };
  }

  const totalGames = libraryEntries.length;
  const ownedGames = libraryEntries.filter((e) => e.status === "owned").length;
  const completedGames = libraryEntries.filter((e) => e.status === "completed").length;
  const totalPlayTime = libraryEntries.reduce((sum, e) => sum + e.playTimeHours, 0);

  const ratingsWithValues = libraryEntries.filter((e) => e.rating !== null).map((e) => e.rating!);
  const averageRating =
    ratingsWithValues.length > 0
      ? Math.round(
          (ratingsWithValues.reduce((sum, r) => sum + r, 0) / ratingsWithValues.length) * 100
        ) / 100
      : null;

  return {
    totalGames,
    ownedGames,
    completedGames,
    totalPlayTime,
    averageRating,
  };
}

// Generators for property-based testing
const gameIdGenerator = fc.uuid();
const userIdGenerator = fc.uuid();

const statusGenerator = fc.constantFrom<"owned" | "playing" | "completed" | "wishlist">(
  "owned",
  "playing",
  "completed",
  "wishlist"
);

const playTimeGenerator = fc.integer({ min: 0, max: 10000 });
const ratingGenerator = fc.option(fc.integer({ min: 1, max: 5 }), { nil: null });

const libraryEntryGenerator = (userId: string) =>
  fc.record({
    gameId: gameIdGenerator,
    userId: fc.constant(userId),
    status: statusGenerator,
    playTimeHours: playTimeGenerator,
    rating: ratingGenerator,
  });

describe("Library Statistics Property-Based Tests", () => {
  describe("Property 8: Statistics calculation correctness", () => {
    it("totalGames equals the count of all library entries", () => {
      fc.assert(
        fc.property(userIdGenerator, fc.integer({ min: 0, max: 100 }), (userId, numEntries) => {
          const entries: LibraryEntry[] = [];
          for (let i = 0; i < numEntries; i++) {
            entries.push({
              gameId: `game-${i}`,
              userId,
              status: ["owned", "playing", "completed", "wishlist"][
                i % 4
              ] as LibraryEntry["status"],
              playTimeHours: i * 10,
              rating: i % 3 === 0 ? null : (i % 5) + 1,
            });
          }

          const stats = calculateLibraryStats(entries);

          // Property: totalGames must equal the number of entries
          expect(stats.totalGames).toBe(entries.length);
        }),
        { numRuns: 30 }
      );
    });

    it("completedGames equals the count of entries with status 'completed'", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.array(statusGenerator, { minLength: 0, maxLength: 50 }),
          (userId, statuses) => {
            const entries: LibraryEntry[] = statuses.map((status, i) => ({
              gameId: `game-${i}`,
              userId,
              status,
              playTimeHours: i * 5,
              rating: null,
            }));

            const stats = calculateLibraryStats(entries);
            const expectedCompleted = statuses.filter((s) => s === "completed").length;

            // Property: completedGames must equal count of 'completed' status entries
            expect(stats.completedGames).toBe(expectedCompleted);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("ownedGames equals the count of entries with status 'owned'", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.array(statusGenerator, { minLength: 0, maxLength: 50 }),
          (userId, statuses) => {
            const entries: LibraryEntry[] = statuses.map((status, i) => ({
              gameId: `game-${i}`,
              userId,
              status,
              playTimeHours: i * 5,
              rating: null,
            }));

            const stats = calculateLibraryStats(entries);
            const expectedOwned = statuses.filter((s) => s === "owned").length;

            // Property: ownedGames must equal count of 'owned' status entries
            expect(stats.ownedGames).toBe(expectedOwned);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("totalPlayTime equals the sum of all playTimeHours", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.array(playTimeGenerator, { minLength: 0, maxLength: 50 }),
          (userId, playTimes) => {
            const entries: LibraryEntry[] = playTimes.map((playTime, i) => ({
              gameId: `game-${i}`,
              userId,
              status: "owned",
              playTimeHours: playTime,
              rating: null,
            }));

            const stats = calculateLibraryStats(entries);
            const expectedTotalPlayTime = playTimes.reduce((sum, pt) => sum + pt, 0);

            // Property: totalPlayTime must equal sum of all playTimeHours
            expect(stats.totalPlayTime).toBe(expectedTotalPlayTime);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("averageRating equals the mean of all non-null ratings", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.array(ratingGenerator, { minLength: 1, maxLength: 50 }),
          (userId, ratings) => {
            const entries: LibraryEntry[] = ratings.map((rating, i) => ({
              gameId: `game-${i}`,
              userId,
              status: "owned",
              playTimeHours: 0,
              rating,
            }));

            const stats = calculateLibraryStats(entries);
            const nonNullRatings = ratings.filter((r): r is number => r !== null);

            if (nonNullRatings.length === 0) {
              // Property: averageRating is null when no ratings exist
              expect(stats.averageRating).toBeNull();
            } else {
              const expectedAverage =
                Math.round(
                  (nonNullRatings.reduce((sum, r) => sum + r, 0) / nonNullRatings.length) * 100
                ) / 100;
              // Property: averageRating equals mean of non-null ratings (rounded to 2 decimals)
              expect(stats.averageRating).toBe(expectedAverage);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("empty library returns zero counts and null average", () => {
      fc.assert(
        fc.property(userIdGenerator, (userId) => {
          const entries: LibraryEntry[] = [];
          const stats = calculateLibraryStats(entries);

          // Property: empty library has all zeros and null average
          expect(stats.totalGames).toBe(0);
          expect(stats.ownedGames).toBe(0);
          expect(stats.completedGames).toBe(0);
          expect(stats.totalPlayTime).toBe(0);
          expect(stats.averageRating).toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it("statistics are additive for play time", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.array(libraryEntryGenerator("placeholder"), { minLength: 1, maxLength: 25 }),
          fc.array(libraryEntryGenerator("placeholder"), { minLength: 1, maxLength: 25 }),
          (userId, entries1Template, entries2Template) => {
            // Fix userId in entries
            const entries1 = entries1Template.map((e, i) => ({
              ...e,
              userId,
              gameId: `game-a-${i}`,
            }));
            const entries2 = entries2Template.map((e, i) => ({
              ...e,
              userId,
              gameId: `game-b-${i}`,
            }));

            const stats1 = calculateLibraryStats(entries1);
            const stats2 = calculateLibraryStats(entries2);
            const combinedStats = calculateLibraryStats([...entries1, ...entries2]);

            // Property: play time is additive
            expect(combinedStats.totalPlayTime).toBe(stats1.totalPlayTime + stats2.totalPlayTime);

            // Property: game counts are additive
            expect(combinedStats.totalGames).toBe(stats1.totalGames + stats2.totalGames);
            expect(combinedStats.completedGames).toBe(
              stats1.completedGames + stats2.completedGames
            );
            expect(combinedStats.ownedGames).toBe(stats1.ownedGames + stats2.ownedGames);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("all ratings contribute equally to average", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 50 }),
          (userId, rating, count) => {
            // All entries have the same rating
            const entries: LibraryEntry[] = [];
            for (let i = 0; i < count; i++) {
              entries.push({
                gameId: `game-${i}`,
                userId,
                status: "owned",
                playTimeHours: 0,
                rating,
              });
            }

            const stats = calculateLibraryStats(entries);

            // Property: when all ratings are the same, average equals that rating
            expect(stats.averageRating).toBe(rating);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("null ratings do not affect average calculation", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 0, max: 30 }),
          (userId, rating, ratedCount, nullCount) => {
            const entries: LibraryEntry[] = [];

            // Add entries with ratings
            for (let i = 0; i < ratedCount; i++) {
              entries.push({
                gameId: `game-rated-${i}`,
                userId,
                status: "owned",
                playTimeHours: 0,
                rating,
              });
            }

            // Add entries without ratings
            for (let i = 0; i < nullCount; i++) {
              entries.push({
                gameId: `game-null-${i}`,
                userId,
                status: "owned",
                playTimeHours: 0,
                rating: null,
              });
            }

            const stats = calculateLibraryStats(entries);

            // Property: null ratings don't affect the average
            // Average should still be the rating value since all rated entries have same rating
            expect(stats.averageRating).toBe(rating);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("status counts are mutually exclusive and exhaustive", () => {
      fc.assert(
        fc.property(
          userIdGenerator,
          fc.array(statusGenerator, { minLength: 1, maxLength: 50 }),
          (userId, statuses) => {
            const entries: LibraryEntry[] = statuses.map((status, i) => ({
              gameId: `game-${i}`,
              userId,
              status,
              playTimeHours: 0,
              rating: null,
            }));

            const stats = calculateLibraryStats(entries);

            const playingCount = statuses.filter((s) => s === "playing").length;
            const wishlistCount = statuses.filter((s) => s === "wishlist").length;

            // Property: all status counts should sum to totalGames
            expect(stats.ownedGames + stats.completedGames + playingCount + wishlistCount).toBe(
              stats.totalGames
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
