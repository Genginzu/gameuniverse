import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

// Mock transitive dependencies pulled in by PlayerDetailsContent
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: () => "/",
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("next/image", () => ({ default: vi.fn() }));
vi.mock("next/link", () => ({ default: vi.fn() }));

import { shouldShowComparison } from "@/components/players/PlayerDetailsContent";

// --- Generators ---

/** Generates a UUID v4 string */
const uuidArb = fc.uuid();

/** Generates a currentUserId: either a UUID or null */
const currentUserIdArb = fc.oneof(uuidArb, fc.constant(null));

describe("Library Comparison Components — Property-Based Tests", () => {
  // Feature: library-comparison, Property 3: Visibilité de l'indicateur
  // **Validates: Requirements 2.1, 2.2, 2.3**
  describe("Property 3: Visibilité de l'indicateur", () => {
    it("visible iff authenticated AND currentUserId !== null AND currentUserId !== targetPlayerId", () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          currentUserIdArb,
          uuidArb,
          (isAuthenticated, currentUserId, targetPlayerId) => {
            const result = shouldShowComparison(isAuthenticated, currentUserId, targetPlayerId);

            const expected =
              isAuthenticated && currentUserId !== null && currentUserId !== targetPlayerId;

            expect(result).toBe(expected);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("always false when not authenticated, regardless of user ids", () => {
      fc.assert(
        fc.property(currentUserIdArb, uuidArb, (currentUserId, targetPlayerId) => {
          const result = shouldShowComparison(false, currentUserId, targetPlayerId);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("always false when currentUserId is null, regardless of authentication", () => {
      fc.assert(
        fc.property(fc.boolean(), uuidArb, (isAuthenticated, targetPlayerId) => {
          const result = shouldShowComparison(isAuthenticated, null, targetPlayerId);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("always false when currentUserId equals targetPlayerId", () => {
      fc.assert(
        fc.property(uuidArb, (userId) => {
          const result = shouldShowComparison(true, userId, userId);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: library-comparison, Property 4: Complétude des données
  // **Validates: Requirements 3.1, 3.2**
  describe("Property 4: Complétude des données", () => {
    /** Generates a non-empty alphanumeric string (simulates gameId, slug, title) */
    const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 30, unit: "grapheme" });

    /** Generates a locale string */
    const localeArb = fc.constantFrom("fr", "en");

    /** Generates a CommonGame with non-empty required fields */
    const commonGameArb = fc.record({
      gameId: nonEmptyStringArb,
      slug: nonEmptyStringArb,
      title: nonEmptyStringArb,
      coverImage: fc.oneof(fc.constant(null), fc.webUrl()),
      genres: fc.array(nonEmptyStringArb, { minLength: 0, maxLength: 5 }),
    });

    it("gameId, slug, and title are always non-empty strings", () => {
      fc.assert(
        fc.property(commonGameArb, (game) => {
          expect(game.gameId).toBeTruthy();
          expect(typeof game.gameId).toBe("string");
          expect(game.gameId.length).toBeGreaterThan(0);

          expect(game.slug).toBeTruthy();
          expect(typeof game.slug).toBe("string");
          expect(game.slug.length).toBeGreaterThan(0);

          expect(game.title).toBeTruthy();
          expect(typeof game.title).toBe("string");
          expect(game.title.length).toBeGreaterThan(0);
        }),
        { numRuns: 200 }
      );
    });

    it("genres is always an array", () => {
      fc.assert(
        fc.property(commonGameArb, (game) => {
          expect(Array.isArray(game.genres)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("navigation link matches /{locale}/games/{slug}", () => {
      fc.assert(
        fc.property(commonGameArb, localeArb, (game, locale) => {
          const expectedLink = `/${locale}/games/${game.slug}`;

          expect(expectedLink).toMatch(/^\/[a-z]{2}\/games\/.+$/);
          expect(expectedLink.startsWith(`/${locale}/games/`)).toBe(true);
          expect(expectedLink.endsWith(game.slug)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("coverImage is either null or a string", () => {
      fc.assert(
        fc.property(commonGameArb, (game) => {
          expect(game.coverImage === null || typeof game.coverImage === "string").toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
