import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

import {
  flattenResults,
  computeNextIndex,
  computePrevIndex,
  getResultUrl,
  type FlatSearchItem,
} from "@/lib/utils/global-search-utils";
import type {
  GlobalSearchCharacterItem,
  GlobalSearchCoachItem,
  GlobalSearchGameItem,
  GlobalSearchPlayerItem,
  GlobalSearchProPlayerItem,
  GlobalSearchResponse,
  GlobalSearchTeamItem,
} from "@/types/global-search";

/**
 * Property-based tests for the global search utilities.
 *
 * The 6 entity types added in F0-07d (#262) introduce new invariants we
 * want to enforce regardless of input size or shape. These tests run
 * fast-check generators against `flattenResults`, `computeNextIndex`,
 * `computePrevIndex` and `getResultUrl`.
 */

// ============================================================================
// Generators
// ============================================================================

const gameItemArb: fc.Arbitrary<GlobalSearchGameItem> = fc.record({
  id: fc.uuid(),
  slug: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  source: fc.constantFrom("local" as const, "igdb" as const),
});

const characterItemArb: fc.Arbitrary<GlobalSearchCharacterItem> = fc.record({
  id: fc.uuid(),
  slug: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
});

const playerItemArb: fc.Arbitrary<GlobalSearchPlayerItem> = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 1, maxLength: 50 }),
});

const teamItemArb: fc.Arbitrary<GlobalSearchTeamItem> = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.string({ minLength: 1, maxLength: 50 }),
});

const proPlayerItemArb: fc.Arbitrary<GlobalSearchProPlayerItem> = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.string({ minLength: 1, maxLength: 50 }),
});

const coachItemArb: fc.Arbitrary<GlobalSearchCoachItem> = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 1, maxLength: 30 }),
  averageRating: fc.float({ min: 0, max: 5, noNaN: true }),
  totalReviews: fc.nat({ max: 1000 }),
  isVerified: fc.boolean(),
});

const responseArb: fc.Arbitrary<GlobalSearchResponse> = fc
  .record({
    games: fc.array(gameItemArb, { maxLength: 10 }),
    characters: fc.array(characterItemArb, { maxLength: 10 }),
    players: fc.array(playerItemArb, { maxLength: 10 }),
    teams: fc.array(teamItemArb, { maxLength: 10 }),
    proPlayers: fc.array(proPlayerItemArb, { maxLength: 10 }),
    coaches: fc.array(coachItemArb, { maxLength: 10 }),
  })
  .map((r) => ({
    ...r,
    counts: {
      games: r.games.length,
      characters: r.characters.length,
      players: r.players.length,
      teams: r.teams.length,
      proPlayers: r.proPlayers.length,
      coaches: r.coaches.length,
    },
  }));

// ============================================================================
// flattenResults
// ============================================================================

describe("Property: flattenResults preserves total length", () => {
  it("returns exactly the sum of input array lengths", () => {
    fc.assert(
      fc.property(responseArb, (response) => {
        const flat = flattenResults(response);
        const expected =
          response.games.length +
          response.characters.length +
          response.players.length +
          response.teams.length +
          response.proPlayers.length +
          response.coaches.length;
        expect(flat).toHaveLength(expected);
      })
    );
  });
});

describe("Property: flattenResults respects the canonical order", () => {
  it("emits groups in this order: game → character → player → team → proPlayer → coach", () => {
    fc.assert(
      fc.property(responseArb, (response) => {
        const flat = flattenResults(response);

        // Find the first index of each type. Skipping a missing type returns
        // -1, which we filter out, then the remaining indices must be sorted
        // ascending — that's the canonical order property.
        const order: FlatSearchItem["type"][] = [
          "game",
          "character",
          "player",
          "team",
          "proPlayer",
          "coach",
        ];
        const firstIndices = order
          .map((type) => flat.findIndex((item) => item.type === type))
          .filter((idx) => idx !== -1);

        const isSortedAscending = firstIndices.every(
          (idx, i) => i === 0 || idx > firstIndices[i - 1]
        );
        expect(isSortedAscending).toBe(true);
      })
    );
  });
});

describe("Property: flattenResults assigns the correct `type` discriminant", () => {
  it("each group's items keep their type tag", () => {
    fc.assert(
      fc.property(responseArb, (response) => {
        const flat = flattenResults(response);

        // Count items per type from the flattened output
        const counts: Record<FlatSearchItem["type"], number> = {
          game: 0,
          character: 0,
          player: 0,
          team: 0,
          proPlayer: 0,
          coach: 0,
        };
        for (const item of flat) counts[item.type]++;

        expect(counts.game).toBe(response.games.length);
        expect(counts.character).toBe(response.characters.length);
        expect(counts.player).toBe(response.players.length);
        expect(counts.team).toBe(response.teams.length);
        expect(counts.proPlayer).toBe(response.proPlayers.length);
        expect(counts.coach).toBe(response.coaches.length);
      })
    );
  });
});

describe("Property: flattenResults preserves item identity", () => {
  it("every original id appears exactly once in the flattened output", () => {
    fc.assert(
      fc.property(responseArb, (response) => {
        const flat = flattenResults(response);

        const flatIds = flat.map((item) => `${item.type}:${item.id}`);
        const expectedIds = [
          ...response.games.map((g) => `game:${g.id}`),
          ...response.characters.map((c) => `character:${c.id}`),
          ...response.players.map((p) => `player:${p.id}`),
          ...response.teams.map((t) => `team:${t.id}`),
          ...response.proPlayers.map((p) => `proPlayer:${p.id}`),
          ...response.coaches.map((c) => `coach:${c.id}`),
        ];

        expect(flatIds.sort()).toEqual(expectedIds.sort());
      })
    );
  });
});

// ============================================================================
// getResultUrl
// ============================================================================

describe("Property: getResultUrl returns a valid path or null for any item", () => {
  it("for any item, the result is null or starts with '/'", () => {
    fc.assert(
      fc.property(responseArb, (response) => {
        const flat = flattenResults(response);
        for (const item of flat) {
          const url = getResultUrl(item);
          if (url !== null) {
            expect(url.startsWith("/")).toBe(true);
          }
        }
      })
    );
  });

  it("only IGDB games return null; everything else returns a path", () => {
    fc.assert(
      fc.property(responseArb, (response) => {
        const flat = flattenResults(response);
        for (const item of flat) {
          const url = getResultUrl(item);
          if (item.type === "game" && item.source === "igdb") {
            expect(url).toBeNull();
          } else {
            expect(url).not.toBeNull();
          }
        }
      })
    );
  });

  it("team URLs follow /esport/teams/{id}; proPlayer URLs /esport/players/{id}", () => {
    fc.assert(
      fc.property(teamItemArb, (team) => {
        const url = getResultUrl({ ...team, type: "team" as const });
        expect(url).toBe(`/esport/teams/${team.id}`);
      })
    );
    fc.assert(
      fc.property(proPlayerItemArb, (player) => {
        const url = getResultUrl({ ...player, type: "proPlayer" as const });
        expect(url).toBe(`/esport/players/${player.id}`);
      })
    );
  });

  it("coach URLs follow /coaching/{username}", () => {
    fc.assert(
      fc.property(coachItemArb, (coach) => {
        const url = getResultUrl({ ...coach, type: "coach" as const });
        expect(url).toBe(`/coaching/${coach.username}`);
      })
    );
  });
});

// ============================================================================
// computeNextIndex / computePrevIndex
// ============================================================================

describe("Property: computeNextIndex always stays within bounds", () => {
  it("output is in [-1, totalResults - 1] for any valid input", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1, max: 100 }),
        fc.nat({ max: 100 }),
        (currentIndex, totalResults) => {
          const next = computeNextIndex(currentIndex, totalResults);
          if (totalResults === 0) {
            expect(next).toBe(-1);
          } else {
            expect(next).toBeGreaterThanOrEqual(-1);
            expect(next).toBeLessThanOrEqual(totalResults - 1);
          }
        }
      )
    );
  });

  it("never decreases the index when results are present", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1, max: 99 }),
        fc.integer({ min: 1, max: 100 }),
        (currentIndex, totalResults) => {
          const next = computeNextIndex(currentIndex, totalResults);
          // With results > 0, the function moves forward (or stays at the last index)
          expect(next).toBeGreaterThanOrEqual(Math.min(currentIndex, totalResults - 1));
        }
      )
    );
  });
});

describe("Property: computePrevIndex never goes below -1", () => {
  it("output is always >= -1", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1, max: 100 }), (currentIndex) => {
        const prev = computePrevIndex(currentIndex);
        expect(prev).toBeGreaterThanOrEqual(-1);
      })
    );
  });

  it("decrements by 1 when above -1, stays at -1 otherwise", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1, max: 100 }), (currentIndex) => {
        const prev = computePrevIndex(currentIndex);
        if (currentIndex <= -1) {
          expect(prev).toBe(-1);
        } else {
          expect(prev).toBe(currentIndex - 1);
        }
      })
    );
  });
});
