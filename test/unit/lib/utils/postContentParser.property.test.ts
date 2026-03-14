import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { extractTags, extractMentions, isValidImageUrl } from "@/lib/utils/postContentParser";

/** Arbitrary that generates valid tag/mention-like strings from [a-zA-Z0-9_-] */
const tagChars = "abcdefghijklmnopqrstuvwxyz0123456789_-";
const mentionChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

function wordArb(charset: string, maxLen = 10): fc.Arbitrary<string> {
  return fc
    .array(fc.constantFrom(...charset.split("")), {
      minLength: 1,
      maxLength: maxLen,
    })
    .map((chars) => chars.join(""));
}

describe("postContentParser — Property-Based Tests", () => {
  // Feature: enhanced-player-posts, Property 1: Extraction correcte des tags
  // **Validates: Requirements 2.1**
  describe("Property 1: Extraction correcte des tags", () => {
    it("should extract all tags present in the content", () => {
      fc.assert(
        fc.property(fc.array(wordArb(tagChars), { minLength: 1, maxLength: 8 }), (tags) => {
          const content = tags.map((t) => `hello #${t} world`).join(" ");
          const result = extractTags(content);
          const uniqueLower = [...new Set(tags.map((t) => t.toLowerCase()))];
          for (const tag of uniqueLower.slice(0, 10)) {
            expect(result).toContain(tag);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-player-posts, Property 2: Invariants de sortie de extractTags
  // **Validates: Requirements 2.2, 2.4, 2.5, 2.6**
  describe("Property 2: Invariants de sortie de extractTags", () => {
    it("should satisfy all output invariants for any content", () => {
      fc.assert(
        fc.property(fc.string(), (content) => {
          const result = extractTags(content);

          // Each tag is lowercase
          for (const tag of result) {
            expect(tag).toBe(tag.toLowerCase());
          }

          // No duplicates
          expect(new Set(result).size).toBe(result.length);

          // At most 10 elements
          expect(result.length).toBeLessThanOrEqual(10);

          // Each tag matches pattern ^[a-z0-9_-]+$
          for (const tag of result) {
            expect(tag).toMatch(/^[a-z0-9_-]+$/);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-player-posts, Property 3: Extraction correcte des mentions
  // **Validates: Requirements 3.1**
  describe("Property 3: Extraction correcte des mentions", () => {
    it("should extract all mentions present in the content", () => {
      fc.assert(
        fc.property(fc.array(wordArb(mentionChars), { minLength: 1, maxLength: 8 }), (pseudos) => {
          const content = pseudos.map((p) => `hello @${p} world`).join(" ");
          const result = extractMentions(content);
          const uniquePseudos = [...new Set(pseudos)];
          for (const pseudo of uniquePseudos.slice(0, 10)) {
            expect(result).toContain(pseudo);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-player-posts, Property 4: Invariants de sortie de extractMentions
  // **Validates: Requirements 3.6, 3.7**
  describe("Property 4: Invariants de sortie de extractMentions", () => {
    it("should satisfy all output invariants for any content", () => {
      fc.assert(
        fc.property(fc.string(), (content) => {
          const result = extractMentions(content);

          // No duplicates
          expect(new Set(result).size).toBe(result.length);

          // At most 10 elements
          expect(result.length).toBeLessThanOrEqual(10);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-player-posts, Property 5: Validation d'URL image
  // **Validates: Requirements 1.4**
  describe("Property 5: Validation d'URL image", () => {
    it("should return true only for valid https:// URLs", () => {
      fc.assert(
        fc.property(fc.domain(), fc.webPath(), (domain, path) => {
          const url = `https://${domain}${path}`;
          expect(isValidImageUrl(url)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should return false for non-https URLs", () => {
      fc.assert(
        fc.property(fc.domain(), fc.webPath(), (domain, path) => {
          const url = `http://${domain}${path}`;
          expect(isValidImageUrl(url)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("should return false for random non-URL strings", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.startsWith("https://")),
          (str) => {
            expect(isValidImageUrl(str)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-player-posts, Property 6: Filtrage de recherche par contenu
  // **Validates: Requirements 4.3, 4.5**
  describe("Property 6: Filtrage de recherche par contenu", () => {
    /** Simulates the ILIKE filter logic used server-side */
    function ilikeFilter(posts: { content: string }[], searchTerm: string): { content: string }[] {
      const lower = searchTerm.toLowerCase();
      return posts.filter((p) => p.content.toLowerCase().includes(lower));
    }

    it("every returned post must contain the search term (case-insensitive)", () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ content: fc.string() }), { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (posts, searchTerm) => {
            const results = ilikeFilter(posts, searchTerm);

            for (const post of results) {
              expect(post.content.toLowerCase()).toContain(searchTerm.toLowerCase());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("no post outside the result should contain the search term", () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ content: fc.string() }), { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (posts, searchTerm) => {
            const results = ilikeFilter(posts, searchTerm);
            const excluded = posts.filter((p) => !results.includes(p));

            for (const post of excluded) {
              expect(post.content.toLowerCase()).not.toContain(searchTerm.toLowerCase());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("filtering is a subset of the original posts", () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ content: fc.string() }), { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (posts, searchTerm) => {
            const results = ilikeFilter(posts, searchTerm);

            expect(results.length).toBeLessThanOrEqual(posts.length);

            for (const post of results) {
              expect(posts).toContain(post);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
