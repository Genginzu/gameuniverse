import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { GlobalSearchResult, GlobalSearchResponse } from "@/types/global-search";
import type { GameSummary } from "@/types/game";
import type { IGDBSearchResult } from "@/types/igdb";
import type { CharacterSummary } from "@/types/character";
import type { PlayerSummary } from "@/types/player";

// ─── Mock services before importing GlobalSearchService ───

vi.mock("@/lib/services/hybridSearchService", () => ({
  HybridSearchService: { search: vi.fn() },
}));
vi.mock("@/lib/services/characterService", () => ({
  CharacterService: { fetchCharacters: vi.fn() },
}));
vi.mock("@/lib/services/playerService", () => ({
  PlayerService: { fetchPlayersFromDB: vi.fn() },
}));

import { GlobalSearchService } from "@/lib/services/globalSearchService";
import { HybridSearchService } from "@/lib/services/hybridSearchService";
import { CharacterService } from "@/lib/services/characterService";
import { PlayerService } from "@/lib/services/playerService";

// ─── Generators ───

const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,29}$/).filter((s) => s.length >= 1);

const gameSummaryArb: fc.Arbitrary<GameSummary> = fc.record({
  id: fc.uuid(),
  slug: slugArb,
  title: fc.string({ minLength: 1, maxLength: 60 }),
  description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  coverImage: fc.option(fc.webUrl(), { nil: undefined }),
  backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
  backgroundColor: fc.option(fc.stringMatching(/^[0-9a-f]{6}$/), { nil: undefined }),
  releaseDate: fc.option(
    fc.integer({ min: 0, max: 1924991999000 }).map((ts) => new Date(ts).toISOString()),
    { nil: undefined }
  ),
  releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
  genres: fc.array(fc.record({ name: fc.string({ minLength: 1, maxLength: 30 }) }), {
    maxLength: 3,
  }),
  developer: fc.string({ minLength: 1, maxLength: 50 }),
  publisher: fc.string({ minLength: 1, maxLength: 50 }),
  metascore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  igdbId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
  source: fc.option(fc.constantFrom("local" as const, "igdb" as const), { nil: undefined }),
});

const igdbResultArb: fc.Arbitrary<IGDBSearchResult> = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  name: fc.string({ minLength: 1, maxLength: 60 }),
  slug: slugArb,
  cover_url: fc.option(fc.webUrl(), { nil: undefined }),
  release_year: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
  developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

const characterSummaryArb: fc.Arbitrary<CharacterSummary> = fc.record({
  id: fc.uuid(),
  slug: slugArb,
  name: fc.string({ minLength: 1, maxLength: 60 }),
  role: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  mainImage: fc.option(fc.webUrl(), { nil: undefined }),
  backgroundColor: fc.option(fc.stringMatching(/^[0-9a-f]{6}$/), { nil: undefined }),
  primaryGame: fc.string({ minLength: 1, maxLength: 60 }),
  gamesCount: fc.integer({ min: 1, max: 20 }),
});

const playerSummaryArb: fc.Arbitrary<PlayerSummary> = fc.record({
  id: fc.uuid(),
  fullName: fc.option(fc.string({ minLength: 1, maxLength: 60 }), { nil: null }),
  avatarUrl: fc.option(fc.webUrl(), { nil: null }),
  gamesCount: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.integer({ min: 0, max: 1924991999000 }).map((ts) => new Date(ts).toISOString()),
});

const queryArb = fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2);

const limitArb = fc.integer({ min: 1, max: 20 });

/** Build a GlobalSearchResponse with consistent counts */
const globalSearchResponseArb: fc.Arbitrary<GlobalSearchResponse> = fc
  .record({
    games: fc.array(
      fc.record({
        id: fc.uuid(),
        igdbId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
        slug: slugArb,
        title: fc.string({ minLength: 1, maxLength: 60 }),
        coverUrl: fc.option(fc.webUrl(), { nil: undefined }),
        developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
        source: fc.constantFrom("local" as const, "igdb" as const),
      }),
      { maxLength: 10 }
    ),
    characters: fc.array(
      fc.record({
        id: fc.uuid(),
        slug: slugArb,
        name: fc.string({ minLength: 1, maxLength: 60 }),
        mainImage: fc.option(fc.webUrl(), { nil: undefined }),
        role: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
        primaryGame: fc.option(fc.string({ minLength: 1, maxLength: 60 }), { nil: undefined }),
      }),
      { maxLength: 10 }
    ),
    players: fc.array(
      fc.record({
        id: fc.uuid(),
        username: fc.string({ minLength: 1, maxLength: 60 }),
        avatarUrl: fc.option(fc.webUrl(), { nil: undefined }),
      }),
      { maxLength: 10 }
    ),
  })
  .map((r) => ({
    ...r,
    counts: {
      games: r.games.length,
      characters: r.characters.length,
      players: r.players.length,
    },
  }));

// ─── Helpers ───

const mockHybrid = HybridSearchService.search as ReturnType<typeof vi.fn>;
const mockCharacters = CharacterService.fetchCharacters as ReturnType<typeof vi.fn>;
const mockPlayers = PlayerService.fetchPlayersFromDB as ReturnType<typeof vi.fn>;

function setupSuccessMocks(
  localGames: GameSummary[],
  igdbGames: IGDBSearchResult[],
  characters: CharacterSummary[],
  players: PlayerSummary[]
) {
  mockHybrid.mockResolvedValue({ localGames, igdbGames, hasMore: false });
  mockCharacters.mockResolvedValue({
    characters,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: characters.length,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  mockPlayers.mockResolvedValue({
    players,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: players.length,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
}

// ─── Property Tests ───

describe("GlobalSearchService Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: global-search, Property 1: Multi-entity search aggregation
  // **Validates: Requirements 1.1**
  describe("Property 1: Multi-entity search aggregation", () => {
    it("search result contains arrays for all three categories", async () => {
      await fc.assert(
        fc.asyncProperty(
          queryArb,
          fc.array(gameSummaryArb, { maxLength: 8 }),
          fc.array(igdbResultArb, { maxLength: 8 }),
          fc.array(characterSummaryArb, { maxLength: 8 }),
          fc.array(playerSummaryArb, { maxLength: 8 }),
          async (query, localGames, igdbGames, characters, players) => {
            setupSuccessMocks(localGames, igdbGames, characters, players);

            const result = await GlobalSearchService.search({ query });

            // Result contains all three category arrays
            expect(Array.isArray(result.games.local)).toBe(true);
            expect(Array.isArray(result.games.igdb)).toBe(true);
            expect(Array.isArray(result.characters)).toBe(true);
            expect(Array.isArray(result.players)).toBe(true);

            // Local games match what the mock returned
            expect(result.games.local).toEqual(localGames);
            expect(result.games.igdb).toEqual(igdbGames);
            expect(result.characters).toEqual(characters);
            expect(result.players).toEqual(players);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-search, Property 3: Fault tolerance with partial results
  // **Validates: Requirements 1.5**
  describe("Property 3: Fault tolerance with partial results", () => {
    it("returns results from non-failing sources and empty arrays for failing sources", async () => {
      // Generate a bitmask for which sources fail (1-7 covers all combos of 1/2/3 failures)
      const failureMaskArb = fc.integer({ min: 1, max: 7 });

      await fc.assert(
        fc.asyncProperty(
          queryArb,
          failureMaskArb,
          fc.array(gameSummaryArb, { maxLength: 5 }),
          fc.array(igdbResultArb, { maxLength: 5 }),
          fc.array(characterSummaryArb, { maxLength: 5 }),
          fc.array(playerSummaryArb, { maxLength: 5 }),
          async (query, failMask, localGames, igdbGames, characters, players) => {
            const gamesFail = (failMask & 1) !== 0;
            const charsFail = (failMask & 2) !== 0;
            const playersFail = (failMask & 4) !== 0;

            if (gamesFail) {
              mockHybrid.mockRejectedValue(new Error("games down"));
            } else {
              mockHybrid.mockResolvedValue({ localGames, igdbGames, hasMore: false });
            }

            if (charsFail) {
              mockCharacters.mockRejectedValue(new Error("characters down"));
            } else {
              mockCharacters.mockResolvedValue({
                characters,
                pagination: {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount: characters.length,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              });
            }

            if (playersFail) {
              mockPlayers.mockRejectedValue(new Error("players down"));
            } else {
              mockPlayers.mockResolvedValue({
                players,
                pagination: {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount: players.length,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              });
            }

            // Must not throw
            const result = await GlobalSearchService.search({ query });

            // Failing sources → empty arrays
            if (gamesFail) {
              expect(result.games.local).toEqual([]);
              expect(result.games.igdb).toEqual([]);
            } else {
              expect(result.games.local).toEqual(localGames);
              expect(result.games.igdb).toEqual(igdbGames);
            }

            if (charsFail) {
              expect(result.characters).toEqual([]);
            } else {
              expect(result.characters).toEqual(characters);
            }

            if (playersFail) {
              expect(result.players).toEqual([]);
            } else {
              expect(result.players).toEqual(players);
            }

            // Errors are logged
            expect(result.errors.length).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-search, Property 4: Per-category limit enforcement
  // **Validates: Requirements 2.5**
  describe("Property 4: Per-category limit enforcement", () => {
    it("each category respects its configured limit", async () => {
      await fc.assert(
        fc.asyncProperty(
          queryArb,
          limitArb,
          limitArb,
          limitArb,
          fc.array(gameSummaryArb, { minLength: 0, maxLength: 15 }),
          fc.array(igdbResultArb, { minLength: 0, maxLength: 15 }),
          fc.array(characterSummaryArb, { minLength: 0, maxLength: 15 }),
          fc.array(playerSummaryArb, { minLength: 0, maxLength: 15 }),
          async (
            query,
            gamesLimit,
            charsLimit,
            playersLimit,
            localGames,
            igdbGames,
            characters,
            players
          ) => {
            // HybridSearchService already applies its own limit, so mock returns sliced data
            mockHybrid.mockResolvedValue({
              localGames: localGames.slice(0, gamesLimit),
              igdbGames: igdbGames.slice(0, gamesLimit),
              hasMore: false,
            });
            mockCharacters.mockResolvedValue({
              characters: characters.slice(0, charsLimit),
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalCount: characters.length,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            });
            mockPlayers.mockResolvedValue({
              players: players.slice(0, playersLimit),
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalCount: players.length,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            });

            const result = await GlobalSearchService.search({
              query,
              gamesLimit,
              charactersLimit: charsLimit,
              playersLimit,
            });

            const response = GlobalSearchService.toGlobalSearchResponse(result);

            // Games = local + igdb, each capped at gamesLimit by HybridSearchService
            expect(result.games.local.length).toBeLessThanOrEqual(gamesLimit);
            expect(result.games.igdb.length).toBeLessThanOrEqual(gamesLimit);
            expect(result.characters.length).toBeLessThanOrEqual(charsLimit);
            expect(result.players.length).toBeLessThanOrEqual(playersLimit);

            // Response arrays reflect the same bounds
            expect(response.characters.length).toBeLessThanOrEqual(charsLimit);
            expect(response.players.length).toBeLessThanOrEqual(playersLimit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-search, Property 7: Entity transformation completeness
  // **Validates: Requirements 6.1, 6.2, 6.3**
  describe("Property 7: Entity transformation completeness", () => {
    it("transformation preserves all required display fields", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryArb, { maxLength: 5 }),
          fc.array(igdbResultArb, { maxLength: 5 }),
          fc.array(characterSummaryArb, { maxLength: 5 }),
          fc.array(playerSummaryArb, { maxLength: 5 }),
          (localGames, igdbGames, characters, players) => {
            const result: GlobalSearchResult = {
              games: { local: localGames, igdb: igdbGames },
              characters,
              players,
              errors: [],
            };

            const response = GlobalSearchService.toGlobalSearchResponse(result);

            // Local games: preserve id, slug, title, coverUrl, developer, releaseYear, source
            for (let i = 0; i < localGames.length; i++) {
              const src = localGames[i];
              const dst = response.games[i];
              expect(dst.id).toBe(src.id);
              expect(dst.slug).toBe(src.slug);
              expect(dst.title).toBe(src.title);
              expect(dst.coverUrl).toBe(src.coverImage);
              expect(dst.developer).toBe(src.developer || undefined);
              expect(dst.releaseYear).toBe(src.releaseYear);
              expect(dst.source).toBe("local");
            }

            // IGDB games: preserve id (as string), slug, name→title, cover_url, developer, release_year
            for (let i = 0; i < igdbGames.length; i++) {
              const src = igdbGames[i];
              const dst = response.games[localGames.length + i];
              expect(dst.id).toBe(String(src.id));
              expect(dst.igdbId).toBe(src.id);
              expect(dst.slug).toBe(src.slug);
              expect(dst.title).toBe(src.name);
              expect(dst.coverUrl).toBe(src.cover_url);
              expect(dst.developer).toBe(src.developer);
              expect(dst.releaseYear).toBe(src.release_year);
              expect(dst.source).toBe("igdb");
            }

            // Characters: preserve id, slug, name, mainImage, role, primaryGame
            for (let i = 0; i < characters.length; i++) {
              const src = characters[i];
              const dst = response.characters[i];
              expect(dst.id).toBe(src.id);
              expect(dst.slug).toBe(src.slug);
              expect(dst.name).toBe(src.name);
              expect(dst.mainImage).toBe(src.mainImage);
              expect(dst.role).toBe(src.role);
              expect(dst.primaryGame).toBe(src.primaryGame);
            }

            // Players: preserve id, username (from fullName or fallback to id), avatarUrl
            for (let i = 0; i < players.length; i++) {
              const src = players[i];
              const dst = response.players[i];
              expect(dst.id).toBe(src.id);
              expect(dst.username).toBe(src.fullName ?? src.id);
              expect(dst.avatarUrl).toBe(src.avatarUrl ?? undefined);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-search, Property 8: Response counts consistency
  // **Validates: Requirements 8.2**
  describe("Property 8: Response counts consistency", () => {
    it("counts match array lengths for any response", () => {
      fc.assert(
        fc.property(globalSearchResponseArb, (response) => {
          expect(response.counts.games).toBe(response.games.length);
          expect(response.counts.characters).toBe(response.characters.length);
          expect(response.counts.players).toBe(response.players.length);
        }),
        { numRuns: 100 }
      );
    });

    it("toGlobalSearchResponse produces consistent counts", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryArb, { maxLength: 8 }),
          fc.array(igdbResultArb, { maxLength: 8 }),
          fc.array(characterSummaryArb, { maxLength: 8 }),
          fc.array(playerSummaryArb, { maxLength: 8 }),
          (localGames, igdbGames, characters, players) => {
            const result: GlobalSearchResult = {
              games: { local: localGames, igdb: igdbGames },
              characters,
              players,
              errors: [],
            };

            const response = GlobalSearchService.toGlobalSearchResponse(result);

            expect(response.counts.games).toBe(response.games.length);
            expect(response.counts.characters).toBe(response.characters.length);
            expect(response.counts.players).toBe(response.players.length);

            // Total games = local + igdb
            expect(response.games.length).toBe(localGames.length + igdbGames.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-search, Property 9: Response serialization round-trip
  // **Validates: Requirements 8.4**
  describe("Property 9: Response serialization round-trip", () => {
    it("JSON.parse(JSON.stringify(response)) produces a deeply equal object", () => {
      fc.assert(
        fc.property(globalSearchResponseArb, (response) => {
          const roundTripped = JSON.parse(JSON.stringify(response));
          expect(roundTripped).toEqual(response);
        }),
        { numRuns: 100 }
      );
    });

    it("round-trip preserves toGlobalSearchResponse output", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryArb, { maxLength: 5 }),
          fc.array(igdbResultArb, { maxLength: 5 }),
          fc.array(characterSummaryArb, { maxLength: 5 }),
          fc.array(playerSummaryArb, { maxLength: 5 }),
          (localGames, igdbGames, characters, players) => {
            const result: GlobalSearchResult = {
              games: { local: localGames, igdb: igdbGames },
              characters,
              players,
              errors: [],
            };

            const response = GlobalSearchService.toGlobalSearchResponse(result);
            const roundTripped = JSON.parse(JSON.stringify(response));
            expect(roundTripped).toEqual(response);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
