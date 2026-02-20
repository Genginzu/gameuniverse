import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: admin-language-management, Property 2: Cohérence de la Recherche et du Tri
 *
 * _For any_ list of languages and _for any_ search query, all returned results
 * must contain the search term in their code or name. _For any_ sort criteria
 * applied, the resulting list must be ordered according to that criteria.
 *
 * **Validates: Requirements 3.3, 3.4**
 */

// --- Types ---

interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string | null;
}

type SortField = "code" | "name";
type SortOrder = "asc" | "desc";

// --- Pure functions under test (mirror the API logic) ---

/**
 * Filters languages where code OR name contains the search term (case-insensitive).
 * Mirrors the Supabase `ilike` filter: `code.ilike.%term%,name.ilike.%term%`
 */
function filterLanguages(languages: SupportedLanguage[], search: string): SupportedLanguage[] {
  const trimmed = search.trim();
  if (!trimmed) return languages;
  const term = trimmed.toLowerCase();
  return languages.filter(
    (lang) => lang.code.toLowerCase().includes(term) || lang.name.toLowerCase().includes(term)
  );
}

/**
 * Sorts languages by a given field in ascending or descending order.
 * Mirrors the Supabase `.order(sort_by, { ascending })` behavior.
 */
function sortLanguages(
  languages: SupportedLanguage[],
  sortBy: SortField,
  sortOrder: SortOrder
): SupportedLanguage[] {
  return [...languages].sort((a, b) => {
    const valA = a[sortBy].toLowerCase();
    const valB = b[sortBy].toLowerCase();
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
}

// --- Generators ---

/** Generates a valid language code: 2-10 lowercase letters with optional hyphens */
const languageCodeGenerator = fc
  .tuple(
    fc.integer({ min: 2, max: 10 }),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .chain(([length, firstChar]) => {
    if (length <= 2) {
      return fc
        .constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
        .map((lastChar) => `${firstChar}${lastChar}`);
    }
    const middleLength = length - 2;
    return fc
      .tuple(
        fc.array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz-".split("")), {
          minLength: middleLength,
          maxLength: middleLength,
        }),
        fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
      )
      .map(([middle, lastChar]) => `${firstChar}${middle.join("")}${lastChar}`)
      .filter((code) => !code.includes("--") && code.length >= 2 && code.length <= 10);
  });

/** Generates a language name: 1-50 printable characters */
const languageNameGenerator = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/** Generates a native name or null */
const nativeNameGenerator = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)
);

/** Generates a single SupportedLanguage */
const languageGenerator: fc.Arbitrary<SupportedLanguage> = fc
  .tuple(languageCodeGenerator, languageNameGenerator, nativeNameGenerator)
  .map(([code, name, native_name]) => ({ code, name, native_name }));

/** Generates a list of languages (0-30 items) */
const languageListGenerator = fc.array(languageGenerator, {
  minLength: 0,
  maxLength: 30,
});

/** Generates a search query (may be empty, whitespace, or a real term) */
const searchQueryGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("  "),
  fc.string({ minLength: 1, maxLength: 20 })
);

/** Generates a sort field */
const sortFieldGenerator: fc.Arbitrary<SortField> = fc.constantFrom(
  "code" as SortField,
  "name" as SortField
);

/** Generates a sort order */
const sortOrderGenerator: fc.Arbitrary<SortOrder> = fc.constantFrom(
  "asc" as SortOrder,
  "desc" as SortOrder
);

// --- Tests ---

describe("useAdminLanguages - Property-Based Tests", () => {
  describe("Property 2: Cohérence de la Recherche et du Tri", () => {
    describe("Search consistency", () => {
      it("all filtered results contain the search term in code or name", () => {
        fc.assert(
          fc.property(languageListGenerator, searchQueryGenerator, (languages, search) => {
            const results = filterLanguages(languages, search);
            const trimmed = search.trim();
            if (!trimmed) {
              // Empty search returns all languages
              expect(results.length).toBe(languages.length);
              return;
            }
            const term = trimmed.toLowerCase();
            for (const lang of results) {
              const matchesCode = lang.code.toLowerCase().includes(term);
              const matchesName = lang.name.toLowerCase().includes(term);
              expect(matchesCode || matchesName).toBe(true);
            }
          }),
          { numRuns: 200 }
        );
      });

      it("no matching language is excluded from results", () => {
        fc.assert(
          fc.property(languageListGenerator, searchQueryGenerator, (languages, search) => {
            const results = filterLanguages(languages, search);
            const trimmed = search.trim();
            if (!trimmed) return;
            const term = trimmed.toLowerCase();
            // Every language that matches should be in results
            for (const lang of languages) {
              const shouldMatch =
                lang.code.toLowerCase().includes(term) || lang.name.toLowerCase().includes(term);
              if (shouldMatch) {
                expect(results).toContain(lang);
              }
            }
          }),
          { numRuns: 200 }
        );
      });

      it("search is case-insensitive", () => {
        fc.assert(
          fc.property(languageListGenerator, languageNameGenerator, (languages, search) => {
            const lowerResults = filterLanguages(languages, search.toLowerCase());
            const upperResults = filterLanguages(languages, search.toUpperCase());
            expect(lowerResults.length).toBe(upperResults.length);
            for (let i = 0; i < lowerResults.length; i++) {
              expect(lowerResults[i]).toBe(upperResults[i]);
            }
          }),
          { numRuns: 200 }
        );
      });
    });

    describe("Sort consistency", () => {
      it("sorted results are ordered according to the sort criteria", () => {
        fc.assert(
          fc.property(
            languageListGenerator,
            sortFieldGenerator,
            sortOrderGenerator,
            (languages, sortBy, sortOrder) => {
              const sorted = sortLanguages(languages, sortBy, sortOrder);
              expect(sorted.length).toBe(languages.length);
              for (let i = 1; i < sorted.length; i++) {
                const prev = sorted[i - 1][sortBy].toLowerCase();
                const curr = sorted[i][sortBy].toLowerCase();
                if (sortOrder === "asc") {
                  expect(prev <= curr).toBe(true);
                } else {
                  expect(prev >= curr).toBe(true);
                }
              }
            }
          ),
          { numRuns: 200 }
        );
      });

      it("sorting preserves all elements (no data loss)", () => {
        fc.assert(
          fc.property(
            languageListGenerator,
            sortFieldGenerator,
            sortOrderGenerator,
            (languages, sortBy, sortOrder) => {
              const sorted = sortLanguages(languages, sortBy, sortOrder);
              expect(sorted.length).toBe(languages.length);
              // Every original language must appear in sorted output
              for (const lang of languages) {
                expect(sorted).toContain(lang);
              }
            }
          ),
          { numRuns: 200 }
        );
      });

      it("sorting does not mutate the original array", () => {
        fc.assert(
          fc.property(
            languageListGenerator,
            sortFieldGenerator,
            sortOrderGenerator,
            (languages, sortBy, sortOrder) => {
              const original = [...languages];
              sortLanguages(languages, sortBy, sortOrder);
              expect(languages).toEqual(original);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("Search + Sort combined", () => {
      it("filtering then sorting produces correctly filtered and ordered results", () => {
        fc.assert(
          fc.property(
            languageListGenerator,
            searchQueryGenerator,
            sortFieldGenerator,
            sortOrderGenerator,
            (languages, search, sortBy, sortOrder) => {
              const filtered = filterLanguages(languages, search);
              const result = sortLanguages(filtered, sortBy, sortOrder);

              // All results match the search
              const trimmed = search.trim();
              if (trimmed) {
                const term = trimmed.toLowerCase();
                for (const lang of result) {
                  const matches =
                    lang.code.toLowerCase().includes(term) ||
                    lang.name.toLowerCase().includes(term);
                  expect(matches).toBe(true);
                }
              }

              // Results are sorted
              for (let i = 1; i < result.length; i++) {
                const prev = result[i - 1][sortBy].toLowerCase();
                const curr = result[i][sortBy].toLowerCase();
                if (sortOrder === "asc") {
                  expect(prev <= curr).toBe(true);
                } else {
                  expect(prev >= curr).toBe(true);
                }
              }
            }
          ),
          { numRuns: 200 }
        );
      });

      it("sorting then filtering gives same set as filtering then sorting", () => {
        fc.assert(
          fc.property(
            languageListGenerator,
            searchQueryGenerator,
            sortFieldGenerator,
            sortOrderGenerator,
            (languages, search, sortBy, sortOrder) => {
              // Approach 1: filter then sort
              const filterFirst = sortLanguages(
                filterLanguages(languages, search),
                sortBy,
                sortOrder
              );
              // Approach 2: sort then filter
              const sortFirst = filterLanguages(
                sortLanguages(languages, sortBy, sortOrder),
                search
              );
              // Same elements (order may differ due to stable sort differences,
              // but the sets should be identical)
              expect(filterFirst.length).toBe(sortFirst.length);
              const codesA = filterFirst.map((l) => l.code).sort();
              const codesB = sortFirst.map((l) => l.code).sort();
              expect(codesA).toEqual(codesB);
            }
          ),
          { numRuns: 200 }
        );
      });
    });
  });
});
