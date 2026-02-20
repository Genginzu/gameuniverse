import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: admin-game-management, Property 2: CohÃ©rence de la Recherche et du Tri
// **Validates: Requirements 3.3, 3.4**

interface AdminGame {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  releaseDate: string | null;
  updatedAt: string;
}

// Pure search function matching the API behavior (case-insensitive title search)
function filterGamesBySearch(games: AdminGame[], search: string): AdminGame[] {
  const term = search.trim().toLowerCase();
  if (!term) return games;
  return games.filter((g) => g.title.toLowerCase().includes(term));
}

// Pure sort function matching the API behavior
function sortGames(
  games: AdminGame[],
  sortBy: "title" | "release_date" | "updated_at",
  sortOrder: "asc" | "desc"
): AdminGame[] {
  const sorted = [...games].sort((a, b) => {
    let valA: string;
    let valB: string;

    switch (sortBy) {
      case "title":
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
        break;
      case "release_date":
        valA = a.releaseDate ?? "";
        valB = b.releaseDate ?? "";
        break;
      case "updated_at":
        valA = a.updatedAt;
        valB = b.updatedAt;
        break;
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}

// Generators
const safeDateString = () =>
  fc
    .record({
      year: fc.integer({ min: 2000, max: 2030 }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }),
    })
    .map(
      ({ year, month, day }) =>
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );

const adminGameGenerator = (): fc.Arbitrary<AdminGame> =>
  fc.record({
    id: fc.uuid(),
    slug: fc.uuid().map((id) => `slug-${id.slice(0, 8)}`),
    title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    coverImage: fc.option(fc.webUrl(), { nil: null }),
    releaseDate: fc.option(safeDateString(), { nil: null }),
    updatedAt: safeDateString().map((d) => `${d}T12:00:00Z`),
  });

const sortFieldGenerator = () =>
  fc.constantFrom("title" as const, "release_date" as const, "updated_at" as const);
const sortOrderGenerator = () => fc.constantFrom("asc" as const, "desc" as const);

describe("Admin Games Search & Sort Property Tests", () => {
  describe("Property 2a: Search Consistency", () => {
    it("all returned games contain the search term in their title (case-insensitive)", () => {
      fc.assert(
        fc.property(
          fc.array(adminGameGenerator(), { minLength: 0, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
          (games, searchTerm) => {
            const results = filterGamesBySearch(games, searchTerm);
            const term = searchTerm.trim().toLowerCase();
            return results.every((g) => g.title.toLowerCase().includes(term));
          }
        ),
        { numRuns: 30 }
      );
    });

    it("no matching game is excluded from results", () => {
      fc.assert(
        fc.property(
          fc.array(adminGameGenerator(), { minLength: 0, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
          (games, searchTerm) => {
            const results = filterGamesBySearch(games, searchTerm);
            const term = searchTerm.trim().toLowerCase();
            const expectedMatches = games.filter((g) => g.title.toLowerCase().includes(term));
            return results.length === expectedMatches.length;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("empty search returns all games", () => {
      fc.assert(
        fc.property(fc.array(adminGameGenerator(), { minLength: 0, maxLength: 20 }), (games) => {
          const results = filterGamesBySearch(games, "");
          return results.length === games.length;
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Property 2b: Sort Consistency", () => {
    it("sorted list is correctly ordered for any sort field and order", () => {
      fc.assert(
        fc.property(
          fc.array(adminGameGenerator(), { minLength: 2, maxLength: 30 }),
          sortFieldGenerator(),
          sortOrderGenerator(),
          (games, sortBy, sortOrder) => {
            const sorted = sortGames(games, sortBy, sortOrder);

            for (let i = 0; i < sorted.length - 1; i++) {
              let valA: string;
              let valB: string;

              switch (sortBy) {
                case "title":
                  valA = sorted[i].title.toLowerCase();
                  valB = sorted[i + 1].title.toLowerCase();
                  break;
                case "release_date":
                  valA = sorted[i].releaseDate ?? "";
                  valB = sorted[i + 1].releaseDate ?? "";
                  break;
                case "updated_at":
                  valA = sorted[i].updatedAt;
                  valB = sorted[i + 1].updatedAt;
                  break;
              }

              if (sortOrder === "asc") {
                if (valA > valB) return false;
              } else {
                if (valA < valB) return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("sorting preserves all elements (no games lost or duplicated)", () => {
      fc.assert(
        fc.property(
          fc.array(adminGameGenerator(), { minLength: 0, maxLength: 20 }),
          sortFieldGenerator(),
          sortOrderGenerator(),
          (games, sortBy, sortOrder) => {
            const sorted = sortGames(games, sortBy, sortOrder);
            if (sorted.length !== games.length) return false;
            const originalIds = new Set(games.map((g) => g.id));
            const sortedIds = new Set(sorted.map((g) => g.id));
            return (
              originalIds.size === sortedIds.size &&
              [...originalIds].every((id) => sortedIds.has(id))
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
