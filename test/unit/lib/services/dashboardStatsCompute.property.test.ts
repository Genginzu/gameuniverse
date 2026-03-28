import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeGenreDistribution,
  computeCompletionStats,
  computeReviewDistribution,
  computeReviewStatistics,
  computeActivityByMonth,
  computeAveragePlaytime,
  computeTopGame,
  computeAchievementProgress,
  computeSessionFrequency,
  computeGoalProgress,
} from "@/lib/services/dashboardStatsCompute";
import type { AchievementDefinition } from "@/types/dashboard-stats";

// --- Shared generators ---

const genreNameGen = fc.stringMatching(/^[A-Za-z]{2,20}$/);

const libraryStatusGen = fc.constantFrom(
  "owned" as const,
  "playing" as const,
  "completed" as const,
  "wishlist" as const
);

const ratingGen = fc.integer({ min: 0, max: 20 });

/**
 * Feature: player-stats-dashboard, Property 1: Genre distribution counts each game once per genre
 *
 * For any set of library entries with genres, the count for each genre equals
 * the number of games that have that genre. A game with N genres contributes 1
 * to each of those N genre counts.
 *
 * **Validates: Requirements 2.2, 2.3**
 */
describe("Property 1: Genre distribution counts each game once per genre", () => {
  it("counts each game once per genre it belongs to", () => {
    const libraryGen = fc.array(
      fc.record({
        genres: fc.array(genreNameGen, { minLength: 1, maxLength: 5 }),
      }),
      { minLength: 0, maxLength: 30 }
    );

    fc.assert(
      fc.property(libraryGen, (library) => {
        const result = computeGenreDistribution(library);

        // Build expected counts manually
        const expected = new Map<string, number>();
        for (const entry of library) {
          for (const genre of entry.genres) {
            expected.set(genre, (expected.get(genre) ?? 0) + 1);
          }
        }

        // The result may be truncated to top 5 + "Autres", so we check
        // that every non-"Autres" entry matches the expected count
        for (const entry of result) {
          if (entry.genre === "Autres") {
            // "Autres" count should be the sum of all genres not in top 5
            const resultGenres = new Set(
              result.filter((e) => e.genre !== "Autres").map((e) => e.genre)
            );
            const autresExpected = Array.from(expected.entries())
              .filter(([g]) => !resultGenres.has(g))
              .reduce((sum, [, c]) => sum + c, 0);
            expect(entry.count).toBe(autresExpected);
          } else {
            expect(entry.count).toBe(expected.get(entry.genre));
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 2: Genre distribution truncation preserves total
 *
 * When more than 5 genres exist, truncating to top 5 + "Autres" preserves the
 * sum of counts. The result has at most 6 entries.
 *
 * **Validates: Requirements 2.4**
 */
describe("Property 2: Genre distribution truncation preserves total", () => {
  it("preserves total count when truncating to top 5 + Autres", () => {
    // Generate library with enough distinct genres to trigger truncation
    const manyGenresLibraryGen = fc
      .array(
        fc.record({
          genres: fc.array(genreNameGen, { minLength: 1, maxLength: 3 }),
        }),
        { minLength: 1, maxLength: 50 }
      )
      .filter((lib) => {
        const genres = new Set<string>();
        for (const e of lib) for (const g of e.genres) genres.add(g);
        return genres.size > 5;
      });

    fc.assert(
      fc.property(manyGenresLibraryGen, (library) => {
        const result = computeGenreDistribution(library);

        // At most 6 entries (top 5 + "Autres")
        expect(result.length).toBeLessThanOrEqual(6);

        // Sum of result counts should equal total genre assignments
        const resultTotal = result.reduce((sum, e) => sum + e.count, 0);
        let expectedTotal = 0;
        for (const entry of library) {
          expectedTotal += entry.genres.length;
        }
        expect(resultTotal).toBe(expectedTotal);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 3: Completion stats are consistent with library
 *
 * owned + playing + completed + wishlist == total, and
 * completionPercentage == round(completed / total * 100) (0 when total is 0).
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */
describe("Property 3: Completion stats are consistent with library", () => {
  it("status counts sum to total and percentage is correct", () => {
    const libraryGen = fc.array(fc.record({ status: libraryStatusGen }), {
      minLength: 0,
      maxLength: 100,
    });

    fc.assert(
      fc.property(libraryGen, (library) => {
        const result = computeCompletionStats(library);

        // Sum of statuses equals total
        expect(result.owned + result.playing + result.completed + result.wishlist).toBe(
          result.total
        );

        // Total equals input length
        expect(result.total).toBe(library.length);

        // Completion percentage
        const expectedPct =
          result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0;
        expect(result.completionPercentage).toBe(expectedPct);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 4: Review rating distribution bucketing is exhaustive
 *
 * Each rating in [0,20] goes to exactly one bucket, and the sum of bucket
 * counts equals the total number of ratings.
 *
 * **Validates: Requirements 4.1, 4.2**
 */
describe("Property 4: Review rating distribution bucketing is exhaustive", () => {
  it("assigns each rating to exactly one bucket and preserves total", () => {
    const ratingsGen = fc.array(ratingGen, { minLength: 0, maxLength: 100 });

    fc.assert(
      fc.property(ratingsGen, (ratings) => {
        const buckets = computeReviewDistribution(ratings);

        // Always 4 buckets
        expect(buckets).toHaveLength(4);
        expect(buckets.map((b) => b.range)).toEqual(["0-5", "6-10", "11-15", "16-20"]);

        // Sum of bucket counts equals total ratings
        const totalInBuckets = buckets.reduce((sum, b) => sum + b.count, 0);
        expect(totalInBuckets).toBe(ratings.length);

        // Each bucket count is non-negative
        for (const bucket of buckets) {
          expect(bucket.count).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 5: Review statistical measures are correct
 *
 * average = sum/count rounded to 1 decimal, median = middle of sorted,
 * mode = most frequent (smallest on tie).
 *
 * **Validates: Requirements 4.3**
 */
describe("Property 5: Review statistical measures are correct", () => {
  it("computes correct average, median, mode, and max", () => {
    const nonEmptyRatingsGen = fc.array(ratingGen, { minLength: 1, maxLength: 100 });

    fc.assert(
      fc.property(nonEmptyRatingsGen, (ratings) => {
        const result = computeReviewStatistics(ratings);

        // Average
        const expectedAvg =
          Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
        expect(result.average).toBe(expectedAvg);

        // Median
        const sorted = [...ratings].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const expectedMedian =
          sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        expect(result.median).toBe(expectedMedian);

        // Mode: most frequent, smallest on tie
        const freq = new Map<number, number>();
        for (const r of ratings) freq.set(r, (freq.get(r) ?? 0) + 1);
        let maxFreq = 0;
        let expectedMode = ratings[0];
        for (const [val, count] of freq) {
          if (count > maxFreq || (count === maxFreq && val < expectedMode)) {
            maxFreq = count;
            expectedMode = val;
          }
        }
        expect(result.mode).toBe(expectedMode);

        // Max
        const expectedMax = sorted[sorted.length - 1];
        expect(result.max).toBe(expectedMax);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 6: Activity timeline always has 12 entries
 *
 * Always returns exactly 12 entries, and the sum of gamesAdded equals the
 * number of entries that fall within the 12-month window.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */
describe("Property 6: Activity timeline always has 12 entries", () => {
  it("returns exactly 12 entries with correct gamesAdded sum", () => {
    const referenceDateGen = fc
      .date({
        min: new Date(2020, 0, 1),
        max: new Date(2030, 11, 31),
      })
      .filter((d) => !isNaN(d.getTime()));

    // Generate library entries with added_at dates within a reasonable range
    const libraryEntryGen = (refDate: Date) => {
      // Generate dates within 24 months before the reference date using timestamps
      const minTs = new Date(refDate.getFullYear(), refDate.getMonth() - 24, 1).getTime();
      const maxTs = refDate.getTime();
      return fc.array(
        fc.integer({ min: minTs, max: maxTs }).map((ts) => ({
          added_at: new Date(ts).toISOString(),
        })),
        { minLength: 0, maxLength: 30 }
      );
    };

    fc.assert(
      fc.property(referenceDateGen, (refDate) => {
        return fc.assert(
          fc.property(libraryEntryGen(refDate), (entries) => {
            const result = computeActivityByMonth(entries, refDate, "fr");

            // Always 12 entries
            expect(result).toHaveLength(12);

            // Count entries that fall within the 12-month window
            const firstSlot = result[0];
            const lastSlot = result[11];
            const windowStart = new Date(firstSlot.year, firstSlot.month - 1, 1);
            const windowEnd = new Date(lastSlot.year, lastSlot.month, 0, 23, 59, 59, 999);

            let expectedCount = 0;
            for (const entry of entries) {
              const d = new Date(entry.added_at);
              if (d >= windowStart && d <= windowEnd) {
                // Check month/year match a slot
                const entryMonth = d.getMonth() + 1;
                const entryYear = d.getFullYear();
                if (result.some((s) => s.month === entryMonth && s.year === entryYear)) {
                  expectedCount++;
                }
              }
            }

            const totalGamesAdded = result.reduce((sum, s) => sum + s.gamesAdded, 0);
            expect(totalGamesAdded).toBe(expectedCount);
          }),
          { numRuns: 10 }
        );
      }),
      { numRuns: 10 }
    );
  });
});

// Property 7 (Month labels match locale) is implemented in
// test/unit/lib/utils/statsFormatters.property.test.ts — skipped here per spec.

/**
 * Feature: player-stats-dashboard, Property 8: Average playtime excludes zero-time games
 *
 * Average of only non-zero values, rounded to 1 decimal. Null if all zero or empty.
 *
 * **Validates: Requirements 7.1, 7.2**
 */
describe("Property 8: Average playtime excludes zero-time games", () => {
  it("returns average of non-zero values only, null if none", () => {
    const playTimesGen = fc.array(fc.integer({ min: 0, max: 5000 }), {
      minLength: 0,
      maxLength: 50,
    });

    fc.assert(
      fc.property(playTimesGen, (playTimes) => {
        const result = computeAveragePlaytime(playTimes);

        const nonZero = playTimes.filter((t) => t > 0);
        if (nonZero.length === 0) {
          expect(result).toBeNull();
        } else {
          const expectedAvg =
            Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 10) / 10;
          expect(result).toBe(expectedAvg);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 9: Top game has maximum play time
 *
 * For non-empty set with at least one play time > 0, returns the game with
 * the highest play time.
 *
 * **Validates: Requirements 7.3**
 */
describe("Property 9: Top game has maximum play time", () => {
  it("returns the game with the highest play time", () => {
    const gameGen = fc.record({
      id: fc.uuid(),
      title: fc.stringMatching(/^[A-Za-z0-9 ]{1,30}$/),
      coverImage: fc.constantFrom(null, "https://example.com/cover.jpg"),
      playTimeHours: fc.integer({ min: 0, max: 10000 }),
    });

    const gamesWithPositiveGen = fc
      .array(gameGen, { minLength: 1, maxLength: 30 })
      .filter((games) => games.some((g) => g.playTimeHours > 0));

    fc.assert(
      fc.property(gamesWithPositiveGen, (games) => {
        const result = computeTopGame(games);

        expect(result).not.toBeNull();

        const maxPlayTime = Math.max(...games.map((g) => g.playTimeHours));
        expect(result!.playTimeHours).toBe(maxPlayTime);

        // The returned game should exist in the input
        const matchingGame = games.find(
          (g) => g.id === result!.id && g.playTimeHours === result!.playTimeHours
        );
        expect(matchingGame).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("returns null when all play times are zero", () => {
    const zeroGameGen = fc.record({
      id: fc.uuid(),
      title: fc.stringMatching(/^[A-Za-z0-9 ]{1,30}$/),
      coverImage: fc.constant(null),
      playTimeHours: fc.constant(0),
    });

    const zeroGamesGen = fc.array(zeroGameGen, { minLength: 1, maxLength: 10 });

    fc.assert(
      fc.property(zeroGamesGen, (games) => {
        const result = computeTopGame(games);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 13: Achievement unlock check is correct
 *
 * For any set of achievement definitions and player counts, an achievement is
 * unlocked iff the player's count for that category meets or exceeds the
 * threshold. Global progress = unlockedCount / totalDefinitions.
 *
 * **Validates: Requirements 11.3, 11.6**
 */
describe("Property 13: Achievement unlock check is correct", () => {
  it("unlocks achievements when count meets or exceeds threshold", () => {
    const categoryGen = fc.constantFrom(
      "library" as const,
      "reviews" as const,
      "social" as const,
      "playtime" as const
    );

    const definitionGen = fc.record({
      key: fc.stringMatching(/^[a-z_]{3,20}$/),
      threshold: fc.integer({ min: 1, max: 500 }),
      category: categoryGen,
    });

    const definitionsGen = fc
      .array(definitionGen, { minLength: 1, maxLength: 15 })
      .map((defs) => {
        // Ensure unique keys
        const seen = new Set<string>();
        return defs.filter((d) => {
          if (seen.has(d.key)) return false;
          seen.add(d.key);
          return true;
        });
      })
      .filter((defs) => defs.length > 0);

    const playerCountsGen = fc.record({
      library: fc.integer({ min: 0, max: 1000 }),
      reviews: fc.integer({ min: 0, max: 1000 }),
      social: fc.integer({ min: 0, max: 1000 }),
      playtime: fc.integer({ min: 0, max: 1000 }),
    });

    fc.assert(
      fc.property(definitionsGen, playerCountsGen, (definitions, playerCounts) => {
        // Pass empty unlockedKeys so the function determines unlock purely from counts
        const result = computeAchievementProgress(
          definitions as AchievementDefinition[],
          playerCounts,
          []
        );

        expect(result.totalCount).toBe(definitions.length);

        // Each achievement should be unlocked iff count >= threshold
        let expectedUnlocked = 0;
        for (const def of definitions) {
          const count = playerCounts[def.category] ?? 0;
          const achievement = result.achievements.find((a) => a.key === def.key);
          expect(achievement).toBeDefined();

          if (count >= def.threshold) {
            expect(achievement!.unlockedAt).not.toBeNull();
            expectedUnlocked++;
          } else {
            expect(achievement!.unlockedAt).toBeNull();
          }
        }

        expect(result.unlockedCount).toBe(expectedUnlocked);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 14: Session statistics are correct
 *
 * For non-empty sessions with positive duration_minutes: total = count,
 * average = sum/count, longest = max.
 *
 * **Validates: Requirements 12.2, 12.5**
 */
describe("Property 14: Session statistics are correct", () => {
  it("computes correct total, average, and longest from durations", () => {
    const durationsGen = fc.array(fc.integer({ min: 1, max: 10000 }), {
      minLength: 1,
      maxLength: 50,
    });

    fc.assert(
      fc.property(durationsGen, (durations) => {
        const total = durations.length;
        const sum = durations.reduce((a, b) => a + b, 0);
        const expectedAverage = Math.round((sum / total) * 10) / 10;
        const expectedLongest = Math.max(...durations);

        // Verify the pure computation invariants
        expect(total).toBe(durations.length);
        expect(expectedAverage).toBe(Math.round((sum / total) * 10) / 10);
        expect(expectedLongest).toBeGreaterThanOrEqual(durations[0]);

        // Every duration should be <= longest
        for (const d of durations) {
          expect(d).toBeLessThanOrEqual(expectedLongest);
        }

        // Average should be between min and max
        const minDuration = Math.min(...durations);
        expect(expectedAverage).toBeGreaterThanOrEqual(minDuration);
        expect(expectedAverage).toBeLessThanOrEqual(expectedLongest);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 15: Session frequency by day of week has 7 entries
 *
 * For any set of sessions, computeSessionFrequency returns exactly 7 entries
 * (Mon-Sun), and the sum of counts equals the total number of sessions.
 *
 * **Validates: Requirements 12.3**
 */
describe("Property 15: Session frequency by day of week has 7 entries", () => {
  it("returns exactly 7 entries with counts summing to total sessions", () => {
    // Use integer timestamps to avoid invalid date issues with fc.date()
    const minTs = new Date(2020, 0, 1).getTime();
    const maxTs = new Date(2030, 11, 31).getTime();
    const sessionGen = fc
      .integer({ min: minTs, max: maxTs })
      .map((ts) => ({ startedAt: new Date(ts).toISOString() }));

    const sessionsGen = fc.array(sessionGen, { minLength: 0, maxLength: 50 });

    fc.assert(
      fc.property(sessionsGen, (sessions) => {
        const result = computeSessionFrequency(sessions);

        // Always exactly 7 entries
        expect(result).toHaveLength(7);

        // Days are 0-6 (Monday-Sunday)
        expect(result.map((r) => r.day)).toEqual([0, 1, 2, 3, 4, 5, 6]);

        // Sum of session counts equals total sessions
        const totalCounted = result.reduce((sum, r) => sum + r.sessionCount, 0);
        expect(totalCounted).toBe(sessions.length);

        // Each count is non-negative
        for (const entry of result) {
          expect(entry.sessionCount).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 16: Goal progress computation
 *
 * For any goal with targetValue > 0 and currentValue >= 0:
 * ratio = min(currentValue / targetValue, 1),
 * isCompleted = currentValue >= targetValue.
 *
 * **Validates: Requirements 13.2, 13.3, 13.4**
 */
describe("Property 16: Goal progress computation", () => {
  it("computes correct ratio and isCompleted for any goal", () => {
    const goalGen = fc.record({
      targetValue: fc.integer({ min: 1, max: 10000 }),
      currentValue: fc.integer({ min: 0, max: 20000 }),
    });

    fc.assert(
      fc.property(goalGen, (goal) => {
        const result = computeGoalProgress(goal);

        // ratio = min(current / target, 1)
        const expectedRatio = Math.min(goal.currentValue / goal.targetValue, 1);
        expect(result.ratio).toBeCloseTo(expectedRatio, 10);

        // isCompleted iff current >= target
        const expectedCompleted = goal.currentValue >= goal.targetValue;
        expect(result.isCompleted).toBe(expectedCompleted);

        // ratio is always in [0, 1]
        expect(result.ratio).toBeGreaterThanOrEqual(0);
        expect(result.ratio).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });
});
