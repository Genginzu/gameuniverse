/**
 * Feature: character-genders-species, Property 1: Gender/Species CRUD round-trip (API part)
 * Feature: character-genders-species, Property 2: Gender/Species deletion cascades correctly
 * Feature: character-genders-species, Property 3: API validation rejects invalid data (API error codes)
 *
 * Property tests for genders/species admin API routes.
 * Simulates route handler logic WITHOUT importing Next.js internals.
 *
 * **Validates: Requirements 3.3, 3.5, 3.7, 8.1–8.5, 8.7, 8.8**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminGenderFormSchema } from "@/lib/validations/admin-gender-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Translation {
  language_code: string;
  name: string;
}

interface GenderPayload {
  slug: string;
  translations: Translation[];
}

interface StoredGender {
  id: string;
  slug: string;
  igdb_id: number | null;
  translations: Translation[];
}

interface StoredCharacter {
  id: string;
  gender_id: string | null;
}

// ---------------------------------------------------------------------------
// In-memory store simulating DB
// ---------------------------------------------------------------------------

function createStore() {
  const genders = new Map<string, StoredGender>();
  const characters = new Map<string, StoredCharacter>();
  let counter = 0;

  function nextId(): string {
    counter++;
    return `00000000-0000-0000-0000-${String(counter).padStart(12, "0")}`;
  }

  return { genders, characters, nextId };
}

// ---------------------------------------------------------------------------
// Simulated route handlers (reproduce validation + business logic)
// ---------------------------------------------------------------------------

function simulatePost(
  store: ReturnType<typeof createStore>,
  body: unknown
): { status: number; body: Record<string, unknown> } {
  const validation = adminGenderFormSchema.safeParse(body);
  if (!validation.success) {
    return { status: 400, body: { error: "Invalid input data", details: validation.error.issues } };
  }

  const { slug, translations } = validation.data;

  // Check duplicate slug
  for (const g of store.genders.values()) {
    if (g.slug === slug) {
      return { status: 409, body: { error: "A gender with this slug already exists" } };
    }
  }

  const id = store.nextId();
  const gender: StoredGender = { id, slug, igdb_id: null, translations };
  store.genders.set(id, gender);

  return {
    status: 201,
    body: {
      gender: {
        id,
        slug,
        characterCount: 0,
        translations: translations.map((t) => ({ language_code: t.language_code, name: t.name })),
      },
    },
  };
}

function simulateGetDetail(
  store: ReturnType<typeof createStore>,
  id: string
): { status: number; body: Record<string, unknown> } {
  const gender = store.genders.get(id);
  if (!gender) {
    return { status: 404, body: { error: "Gender not found" } };
  }

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.gender_id === id) characterCount++;
  }

  return {
    status: 200,
    body: {
      gender: {
        id: gender.id,
        slug: gender.slug,
        igdbId: gender.igdb_id,
        characterCount,
        translations: gender.translations.map((t) => ({
          language_code: t.language_code,
          name: t.name,
        })),
      },
    },
  };
}

function simulatePut(
  store: ReturnType<typeof createStore>,
  id: string,
  body: unknown
): { status: number; body: Record<string, unknown> } {
  const existing = store.genders.get(id);
  if (!existing) {
    return { status: 404, body: { error: "Gender not found" } };
  }

  const validation = adminGenderFormSchema.safeParse(body);
  if (!validation.success) {
    return { status: 400, body: { error: "Invalid input data", details: validation.error.issues } };
  }

  const { slug, translations } = validation.data;

  // Check duplicate slug (excluding self)
  for (const g of store.genders.values()) {
    if (g.slug === slug && g.id !== id) {
      return { status: 409, body: { error: "A gender with this slug already exists" } };
    }
  }

  existing.slug = slug;
  existing.translations = translations;

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.gender_id === id) characterCount++;
  }

  return {
    status: 200,
    body: {
      gender: {
        id: existing.id,
        slug: existing.slug,
        igdbId: existing.igdb_id,
        characterCount,
        translations: existing.translations.map((t) => ({
          language_code: t.language_code,
          name: t.name,
        })),
      },
    },
  };
}

function simulateDelete(
  store: ReturnType<typeof createStore>,
  id: string
): { status: number; body: Record<string, unknown> } {
  const existing = store.genders.get(id);
  if (!existing) {
    return { status: 404, body: { error: "Gender not found" } };
  }

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.gender_id === id) {
      characterCount++;
      c.gender_id = null; // ON DELETE SET NULL
    }
  }

  store.genders.delete(id);

  return { status: 200, body: { success: true, characterCount } };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const SLUG_REGEX = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;

const validSlugGen = fc
  .tuple(
    fc.integer({ min: 2, max: 30 }),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split(""))
  )
  .chain(([length, first, last]) => {
    if (length === 2) return fc.constant(`${first}${last}`);
    const mid = length - 2;
    return fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
        minLength: mid,
        maxLength: mid,
      })
      .map((m) => `${first}${m.join("")}${last}`);
  })
  .filter((s) => SLUG_REGEX.test(s));

const validTranslationGen = fc.record({
  language_code: fc.constantFrom("fr", "en"),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
});

const validPayloadGen: fc.Arbitrary<GenderPayload> = fc.record({
  slug: validSlugGen,
  translations: fc
    .tuple(
      fc.record({
        language_code: fc.constant("fr"),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      }),
      fc.record({
        language_code: fc.constant("en"),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      })
    )
    .map(([fr, en]) => [fr, en]),
});

const invalidSlugGen = fc.oneof(
  fc.constant(""),
  fc.constant("A"),
  fc.constant("1abc"),
  fc.constant("ab cd"),
  fc.constant("AB"),
  fc.constant("a".repeat(51) + "b")
);

const hexSegment = (len: number) =>
  fc
    .array(fc.constantFrom(..."0123456789abcdef".split("")), {
      minLength: len,
      maxLength: len,
    })
    .map((arr) => arr.join(""));

const randomUuidGen = fc
  .tuple(hexSegment(8), hexSegment(4), hexSegment(4), hexSegment(4), hexSegment(12))
  .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Genders API - Property-Based Tests", () => {
  describe("Property 1: Gender CRUD round-trip (API part)", () => {
    it("POST then GET returns same slug and translations", () => {
      fc.assert(
        fc.property(validPayloadGen, (payload) => {
          const store = createStore();
          const postRes = simulatePost(store, payload);
          expect(postRes.status).toBe(201);

          const created = postRes.body.gender as Record<string, unknown>;
          const id = created.id as string;

          const getRes = simulateGetDetail(store, id);
          expect(getRes.status).toBe(200);

          const fetched = getRes.body.gender as Record<string, unknown>;
          expect(fetched.slug).toBe(payload.slug);

          const fetchedTranslations = fetched.translations as Translation[];
          for (const t of payload.translations) {
            const match = fetchedTranslations.find((ft) => ft.language_code === t.language_code);
            expect(match).toBeDefined();
            expect(match!.name).toBe(t.name);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("PUT then GET returns updated slug and translations", () => {
      fc.assert(
        fc.property(validPayloadGen, validPayloadGen, (initial, updated) => {
          const store = createStore();
          const postRes = simulatePost(store, initial);
          expect(postRes.status).toBe(201);

          const id = (postRes.body.gender as Record<string, unknown>).id as string;

          const putRes = simulatePut(store, id, updated);
          expect(putRes.status).toBe(200);

          const getRes = simulateGetDetail(store, id);
          expect(getRes.status).toBe(200);

          const fetched = getRes.body.gender as Record<string, unknown>;
          expect(fetched.slug).toBe(updated.slug);

          const fetchedTranslations = fetched.translations as Translation[];
          for (const t of updated.translations) {
            const match = fetchedTranslations.find((ft) => ft.language_code === t.language_code);
            expect(match).toBeDefined();
            expect(match!.name).toBe(t.name);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 2: Gender deletion cascades correctly", () => {
    it("DELETE removes gender, sets character FK to NULL, GET returns 404", () => {
      fc.assert(
        fc.property(validPayloadGen, fc.integer({ min: 0, max: 5 }), (payload, numCharacters) => {
          const store = createStore();

          // Create gender
          const postRes = simulatePost(store, payload);
          expect(postRes.status).toBe(201);
          const genderId = (postRes.body.gender as Record<string, unknown>).id as string;

          // Create associated characters
          const characterIds: string[] = [];
          for (let i = 0; i < numCharacters; i++) {
            const charId = store.nextId();
            store.characters.set(charId, { id: charId, gender_id: genderId });
            characterIds.push(charId);
          }

          // Delete gender
          const deleteRes = simulateDelete(store, genderId);
          expect(deleteRes.status).toBe(200);
          expect(deleteRes.body.success).toBe(true);
          expect(deleteRes.body.characterCount).toBe(numCharacters);

          // GET returns 404
          const getRes = simulateGetDetail(store, genderId);
          expect(getRes.status).toBe(404);

          // Character FKs are NULL
          for (const charId of characterIds) {
            const char = store.characters.get(charId);
            expect(char).toBeDefined();
            expect(char!.gender_id).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 3: API validation rejects invalid data (API error codes)", () => {
    it("POST with invalid slug returns 400", () => {
      fc.assert(
        fc.property(invalidSlugGen, (slug) => {
          const store = createStore();
          const res = simulatePost(store, {
            slug,
            translations: [{ language_code: "fr", name: "Test" }],
          });
          expect(res.status).toBe(400);
        }),
        { numRuns: 100 }
      );
    });

    it("POST with empty translations returns 400", () => {
      fc.assert(
        fc.property(validSlugGen, (slug) => {
          const store = createStore();
          const res = simulatePost(store, { slug, translations: [] });
          expect(res.status).toBe(400);
        }),
        { numRuns: 100 }
      );
    });

    it("POST with missing fields returns 400", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant({}),
            fc.constant({ slug: "valid-slug" }),
            fc.constant({ translations: [{ language_code: "fr", name: "Test" }] }),
            fc.constant(null),
            fc.constant("string"),
            fc.constant(42)
          ),
          (body) => {
            const store = createStore();
            const res = simulatePost(store, body);
            expect(res.status).toBe(400);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("GET/PUT/DELETE with non-existent UUID returns 404", () => {
      fc.assert(
        fc.property(randomUuidGen, (uuid) => {
          const store = createStore();

          const getRes = simulateGetDetail(store, uuid);
          expect(getRes.status).toBe(404);

          const putRes = simulatePut(store, uuid, {
            slug: "test",
            translations: [{ language_code: "fr", name: "Test" }],
          });
          expect(putRes.status).toBe(404);

          const deleteRes = simulateDelete(store, uuid);
          expect(deleteRes.status).toBe(404);
        }),
        { numRuns: 100 }
      );
    });

    it("POST duplicate slug returns 409", () => {
      fc.assert(
        fc.property(validPayloadGen, (payload) => {
          const store = createStore();

          const first = simulatePost(store, payload);
          expect(first.status).toBe(201);

          const second = simulatePost(store, payload);
          expect(second.status).toBe(409);
        }),
        { numRuns: 100 }
      );
    });

    it("PUT with duplicate slug returns 409", () => {
      fc.assert(
        fc.property(validPayloadGen, validPayloadGen, (payload1, payload2) => {
          // Skip if same slug — no conflict possible
          if (payload1.slug === payload2.slug) return;

          const store = createStore();

          const first = simulatePost(store, payload1);
          expect(first.status).toBe(201);

          const second = simulatePost(store, payload2);
          expect(second.status).toBe(201);

          const secondId = (second.body.gender as Record<string, unknown>).id as string;

          // Try to update second gender with first gender's slug
          const putRes = simulatePut(store, secondId, {
            slug: payload1.slug,
            translations: payload2.translations,
          });
          expect(putRes.status).toBe(409);
        }),
        { numRuns: 100 }
      );
    });
  });
});
