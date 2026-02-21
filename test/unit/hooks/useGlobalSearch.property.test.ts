import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeNextIndex,
  computePrevIndex,
  getResultUrl,
  type FlatSearchItem,
} from "@/lib/utils/global-search-utils";

// ─── Generators ───

const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,29}$/).filter((s) => s.length >= 1);

const gameLocalItemArb: fc.Arbitrary<FlatSearchItem> = fc
  .record({
    id: fc.uuid(),
    slug: slugArb,
    title: fc.string({ minLength: 1, maxLength: 60 }),
    coverUrl: fc.option(fc.webUrl(), { nil: undefined }),
    developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
    source: fc.constant("local" as const),
    igdbId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
  })
  .map((g) => ({ ...g, type: "game" as const }));

const gameIgdbItemArb: fc.Arbitrary<FlatSearchItem> = fc
  .record({
    id: fc.uuid(),
    slug: slugArb,
    title: fc.string({ minLength: 1, maxLength: 60 }),
    coverUrl: fc.option(fc.webUrl(), { nil: undefined }),
    developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
    source: fc.constant("igdb" as const),
    igdbId: fc.integer({ min: 1, max: 999999 }),
  })
  .map((g) => ({ ...g, type: "game" as const }));

const characterItemArb: fc.Arbitrary<FlatSearchItem> = fc
  .record({
    id: fc.uuid(),
    slug: slugArb,
    name: fc.string({ minLength: 1, maxLength: 60 }),
    mainImage: fc.option(fc.webUrl(), { nil: undefined }),
    role: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
    primaryGame: fc.option(fc.string({ minLength: 1, maxLength: 60 }), { nil: undefined }),
  })
  .map((c) => ({ ...c, type: "character" as const }));

const playerItemArb: fc.Arbitrary<FlatSearchItem> = fc
  .record({
    id: fc.uuid(),
    username: fc.string({ minLength: 1, maxLength: 60 }),
    avatarUrl: fc.option(fc.webUrl(), { nil: undefined }),
  })
  .map((p) => ({ ...p, type: "player" as const }));

const flatSearchItemArb: fc.Arbitrary<FlatSearchItem> = fc.oneof(
  gameLocalItemArb,
  gameIgdbItemArb,
  characterItemArb,
  playerItemArb
);

// ─── Property Tests ───

describe("useGlobalSearch Utilities Property-Based Tests", () => {
  // Feature: global-search, Property 5: Keyboard navigation index management
  // **Validates: Requirements 4.1, 4.2**
  describe("Property 5: Keyboard navigation index management", () => {
    it("Arrow Down moves index to (current + 1) clamped to N - 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: -1, max: 49 }),
          (totalResults, rawIndex) => {
            const currentIndex = Math.min(rawIndex, totalResults - 1);
            const next = computeNextIndex(currentIndex, totalResults);
            const expected = Math.min(currentIndex + 1, totalResults - 1);
            expect(next).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Arrow Up moves index to (current - 1) clamped to -1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: -1, max: 49 }),
          (totalResults, rawIndex) => {
            const currentIndex = Math.min(rawIndex, totalResults - 1);
            const prev = computePrevIndex(currentIndex);
            const expected = Math.max(currentIndex - 1, -1);
            expect(prev).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("index always remains in range [-1, N - 1] after any sequence of navigations", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.array(fc.constantFrom("up", "down"), { minLength: 1, maxLength: 30 }),
          (totalResults, actions) => {
            let index = -1; // start with no selection
            for (const action of actions) {
              if (action === "down") {
                index = computeNextIndex(index, totalResults);
              } else {
                index = computePrevIndex(index);
              }
              // Invariant: index always in [-1, N-1]
              expect(index).toBeGreaterThanOrEqual(-1);
              expect(index).toBeLessThanOrEqual(totalResults - 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("computeNextIndex returns -1 when totalResults <= 0", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 0 }),
          fc.integer({ min: -5, max: 10 }),
          (totalResults, currentIndex) => {
            expect(computeNextIndex(currentIndex, totalResults)).toBe(-1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-search, Property 6: Result-to-URL mapping
  // **Validates: Requirements 4.3, 5.1, 5.3, 5.4**
  describe("Property 6: Result-to-URL mapping", () => {
    it("local game URL matches /games/{slug} (no locale prefix)", () => {
      fc.assert(
        fc.property(gameLocalItemArb, (item) => {
          const url = getResultUrl(item);
          expect(url).toBe(`/games/${item.slug}`);
        }),
        { numRuns: 100 }
      );
    });

    it("IGDB game returns null (not navigable directly)", () => {
      fc.assert(
        fc.property(gameIgdbItemArb, (item) => {
          const url = getResultUrl(item);
          expect(url).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it("character URL matches /characters/{slug} (no locale prefix)", () => {
      fc.assert(
        fc.property(characterItemArb, (item) => {
          const url = getResultUrl(item);
          if (item.type === "character") {
            expect(url).toBe(`/characters/${item.slug}`);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("player URL matches /players/{id} (no locale prefix)", () => {
      fc.assert(
        fc.property(playerItemArb, (item) => {
          const url = getResultUrl(item);
          if (item.type === "player") {
            expect(url).toBe(`/players/${item.id}`);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("URL always matches the expected pattern for any item type", () => {
      fc.assert(
        fc.property(flatSearchItemArb, (item) => {
          const url = getResultUrl(item);
          switch (item.type) {
            case "game":
              if (item.source === "local") {
                expect(url).toBe(`/games/${item.slug}`);
              } else {
                expect(url).toBeNull();
              }
              break;
            case "character":
              expect(url).toBe(`/characters/${item.slug}`);
              break;
            case "player":
              expect(url).toBe(`/players/${item.id}`);
              break;
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
