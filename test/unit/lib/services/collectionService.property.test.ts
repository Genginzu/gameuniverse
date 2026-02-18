import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import {
  generateSlug,
  calculateNextPosition,
  reorderPositions,
} from "../../../../src/lib/services/collectionService";
import type { CollectionItem } from "../../../../src/types/collection";

/**
 * Feature: game-collections, Property 3: Génération de slug
 *
 * _Pour tout_ nom de collection valide, le slug généré doit être une chaîne
 * URL-safe (composée uniquement de caractères alphanumériques minuscules et de
 * tirets), non vide, et déterministe (le même nom produit toujours le même slug).
 *
 * **Validates: Requirements 1.3**
 */

// --- Generators ---

/** Valid collection name: 1-100 chars, not whitespace-only */
const validNameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** URL-safe slug pattern: only lowercase a-z, 0-9, and hyphens */
const URL_SAFE_REGEX = /^[a-z0-9-]+$/;

// --- Tests ---

describe("Collection Service - Property-Based Tests", () => {
  describe("Property 3: Génération de slug", () => {
    // Feature: game-collections, Property 3: Génération de slug

    it("slug is URL-safe: only lowercase a-z, 0-9, and hyphens", () => {
      fc.assert(
        fc.property(validNameGenerator, (name) => {
          const slug = generateSlug(name);
          expect(slug).toMatch(URL_SAFE_REGEX);
        }),
        { numRuns: 200 }
      );
    });

    it("slug is non-empty for any valid name", () => {
      fc.assert(
        fc.property(validNameGenerator, (name) => {
          const slug = generateSlug(name);
          expect(slug.length).toBeGreaterThan(0);
        }),
        { numRuns: 200 }
      );
    });

    it("slug is deterministic: same name always produces same slug", () => {
      fc.assert(
        fc.property(validNameGenerator, (name) => {
          const slug1 = generateSlug(name);
          const slug2 = generateSlug(name);
          expect(slug1).toBe(slug2);
        }),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Feature: game-collections, Property 4: Position d'ajout séquentielle
   *
   * _Pour toute_ collection contenant N éléments, l'ajout d'un nouveau jeu doit
   * créer un élément avec une position égale à N, et la collection doit ensuite
   * contenir N+1 éléments.
   *
   * **Validates: Requirements 2.1**
   */

  // --- Generator for CollectionItem arrays ---

  const collectionItemGenerator: fc.Arbitrary<CollectionItem> = fc.record({
    id: fc.uuid(),
    gameId: fc.uuid(),
    slug: fc.string({ minLength: 1, maxLength: 30 }).map((s) => s.replace(/\s/g, "-")),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    coverImage: fc.option(fc.webUrl(), { nil: null }),
    genres: fc.array(fc.record({ name: fc.string({ minLength: 1, maxLength: 20 }) }), {
      minLength: 0,
      maxLength: 3,
    }),
    note: fc.option(fc.string({ maxLength: 250 }), { nil: null }),
    position: fc.nat(),
    addedAt: fc.integer({ min: 0, max: 2_000_000_000_000 }).map((ts) => new Date(ts).toISOString()),
  });

  const collectionItemsGenerator = (minLength = 0, maxLength = 50) =>
    fc
      .array(collectionItemGenerator, { minLength, maxLength })
      .map((items) => items.map((item, i) => ({ ...item, position: i })));

  /** Lightweight generator for reorderPositions (only needs gameId) */
  const gameIdItemsGenerator = (minLength = 1, maxLength = 50) =>
    fc.array(fc.record({ gameId: fc.uuid() }), { minLength, maxLength });

  describe("Property 4: Position d'ajout séquentielle", () => {
    // Feature: game-collections, Property 4: Position d'ajout séquentielle

    it("next position equals the number of existing items", () => {
      fc.assert(
        fc.property(collectionItemsGenerator(0, 100), (items) => {
          const nextPosition = calculateNextPosition(items);
          expect(nextPosition).toBe(items.length);
        }),
        { numRuns: 200 }
      );
    });

    it("adding an item at next position yields N+1 items", () => {
      fc.assert(
        fc.property(collectionItemsGenerator(0, 99), collectionItemGenerator, (items, newItem) => {
          const n = items.length;
          const nextPosition = calculateNextPosition(items);
          const updatedItems = [...items, { ...newItem, position: nextPosition }];
          expect(updatedItems.length).toBe(n + 1);
          expect(updatedItems[updatedItems.length - 1].position).toBe(n);
        }),
        { numRuns: 200 }
      );
    });

    it("next position is always non-negative", () => {
      fc.assert(
        fc.property(collectionItemsGenerator(0, 100), (items) => {
          expect(calculateNextPosition(items)).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Feature: game-collections, Property 6: Réordonnancement des positions après suppression
   *
   * _Pour toute_ collection contenant N éléments, après la suppression d'un élément,
   * la collection doit contenir N-1 éléments et les positions doivent former une
   * séquence contiguë de 0 à N-2.
   *
   * **Validates: Requirements 2.3**
   */

  describe("Property 6: Réordonnancement des positions après suppression", () => {
    // Feature: game-collections, Property 6: Réordonnancement des positions après suppression

    it("result contains N-1 items after removing one", () => {
      fc.assert(
        fc.property(
          gameIdItemsGenerator(1, 100).chain((items) =>
            fc.tuple(fc.constant(items), fc.integer({ min: 0, max: items.length - 1 }))
          ),
          ([items, removedIndex]) => {
            const result = reorderPositions(items, removedIndex);
            expect(result.length).toBe(items.length - 1);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("positions form a contiguous sequence from 0 to N-2", () => {
      fc.assert(
        fc.property(
          gameIdItemsGenerator(1, 100).chain((items) =>
            fc.tuple(fc.constant(items), fc.integer({ min: 0, max: items.length - 1 }))
          ),
          ([items, removedIndex]) => {
            const result = reorderPositions(items, removedIndex);
            const positions = result.map((r) => r.position);
            const expected = Array.from({ length: items.length - 1 }, (_, i) => i);
            expect(positions).toEqual(expected);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("removed item's gameId is not in the result", () => {
      fc.assert(
        fc.property(
          gameIdItemsGenerator(1, 50).chain((items) =>
            fc.tuple(fc.constant(items), fc.integer({ min: 0, max: items.length - 1 }))
          ),
          ([items, removedIndex]) => {
            const removedGameId = items[removedIndex].gameId;
            const result = reorderPositions(items, removedIndex);
            const resultGameIds = result.map((r) => r.gameId);
            expect(resultGameIds).not.toContain(removedGameId);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("relative order of remaining items is preserved", () => {
      fc.assert(
        fc.property(
          gameIdItemsGenerator(2, 50).chain((items) =>
            fc.tuple(fc.constant(items), fc.integer({ min: 0, max: items.length - 1 }))
          ),
          ([items, removedIndex]) => {
            const result = reorderPositions(items, removedIndex);
            const expectedGameIds = items
              .filter((_, i) => i !== removedIndex)
              .map((item) => item.gameId);
            const resultGameIds = result.map((r) => r.gameId);
            expect(resultGameIds).toEqual(expectedGameIds);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
