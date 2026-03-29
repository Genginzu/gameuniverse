import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  EDITABLE_FIELDS,
  REQUIRED_FIELDS,
  type EntityType,
  type TranslationStats,
} from "@/types/admin-translations";

/**
 * Feature: admin-translation-management, Property 3: Complétude des champs de traduction retournés
 *
 * _For any_ entity type, the object returned by the translation service must contain
 * exactly the keys defined in EDITABLE_FIELDS[entityType], and each value must be
 * a non-empty string.
 *
 * **Validates: Requirements 1.5, 3.4, 3.5**
 */

// --- Mock setup ---

// Build a mock response for generateObject based on entity type and input fields
function buildMockTranslation(entityType: EntityType): Record<string, string> {
  const fields = EDITABLE_FIELDS[entityType];
  const result: Record<string, string> = {};
  for (const field of fields) {
    result[field] = `translated_${field}_value`;
  }
  return result;
}

// Track the entityType passed to translateFields so the mock can respond correctly
let capturedEntityType: EntityType = "games";

vi.mock("ai", () => ({
  generateObject: vi.fn(async () => ({
    object: buildMockTranslation(capturedEntityType),
  })),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => "mock-model")),
}));

// --- Generators ---

const ALL_ENTITY_TYPES: EntityType[] = [
  "games",
  "characters",
  "genres",
  "companies",
  "platforms",
  "character_roles",
  "genders",
  "species",
  "content_descriptors",
  "ratings",
];

const entityTypeGenerator = fc.constantFrom(...ALL_ENTITY_TYPES);

/** Generate a non-empty string for source field values */
const nonEmptyStringGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** Generate source fields matching EDITABLE_FIELDS for a given entity type */
function sourceFieldsGenerator(entityType: EntityType) {
  const fields = EDITABLE_FIELDS[entityType];
  const entries = fields.map((field) =>
    nonEmptyStringGenerator.map((value) => [field, value] as [string, string])
  );
  return fc
    .tuple(...(entries as [(typeof entries)[0], ...typeof entries]))
    .map((pairs) => Object.fromEntries(pairs));
}

const validLangGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .map(([a, b]) => `${a}${b}`);

// --- Tests ---

describe("Feature: admin-translation-management, Property 3: Complétude des champs de traduction retournés", () => {
  beforeEach(() => {
    process.env.VERCEL_AI_GATEWAY_API_KEY = "test-api-key";
  });

  it("translateFields returns exactly the keys from EDITABLE_FIELDS[entityType] for any entity type", async () => {
    const { translateFields } = await import("@/lib/services/aiTranslateService");

    await fc.assert(
      fc.asyncProperty(
        entityTypeGenerator,
        validLangGenerator,
        validLangGenerator.filter((lang) => true),
        async (entityType, sourceLang, targetLang) => {
          // Set the captured entity type so the mock responds with correct fields
          capturedEntityType = entityType;

          const sourceFields: Record<string, string> = {};
          for (const field of EDITABLE_FIELDS[entityType]) {
            sourceFields[field] = `source_${field}`;
          }

          const result = await translateFields({
            sourceLang,
            targetLang,
            entityType,
            fields: sourceFields,
          });

          const expectedKeys = [...EDITABLE_FIELDS[entityType]].sort();
          const actualKeys = Object.keys(result).sort();

          // The returned object must contain exactly the keys from EDITABLE_FIELDS
          expect(actualKeys).toEqual(expectedKeys);

          // Each value must be a non-empty string
          for (const key of expectedKeys) {
            expect(typeof result[key]).toBe("string");
            expect(result[key].length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: admin-translation-management, Property 1: Classification correcte du statut de traduction
 *
 * _For any_ entity type and _for any_ entity with any combination of filled/empty fields
 * in the target language, the returned status must be:
 * - "missing" if the translation row doesn't exist (null)
 * - "complete" if all required fields (defined in REQUIRED_FIELDS) are filled and non-empty
 * - "partial" otherwise (some but not all required fields filled)
 * - "missing" if all required fields are empty/null
 *
 * **Validates: Requirements 1.4, 2.3**
 */

import { classifyStatus } from "@/lib/services/translationService";

const ALL_ENTITY_TYPES_P1: EntityType[] = [
  "games",
  "characters",
  "genres",
  "companies",
  "platforms",
  "character_roles",
  "genders",
  "species",
  "content_descriptors",
  "ratings",
];

const entityTypeGenP1 = fc.constantFrom(...ALL_ENTITY_TYPES_P1);

/** Generate a non-empty, non-blank string */
const filledStringGen = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

describe("Feature: admin-translation-management, Property 1: Classification correcte du statut de traduction", () => {
  it("returns 'missing' when row is null", () => {
    fc.assert(
      fc.property(entityTypeGenP1, (entityType) => {
        const requiredFields = REQUIRED_FIELDS[entityType];
        const status = classifyStatus(null, requiredFields);
        expect(status).toBe("missing");
      }),
      { numRuns: 100 }
    );
  });

  it("returns 'complete' when all required fields are filled with non-empty strings", () => {
    fc.assert(
      fc.property(
        entityTypeGenP1.chain((et) =>
          fc.tuple(
            fc.constant(et),
            fc.record(Object.fromEntries(REQUIRED_FIELDS[et].map((f) => [f, filledStringGen])))
          )
        ),
        ([entityType, row]) => {
          const requiredFields = REQUIRED_FIELDS[entityType];
          const status = classifyStatus(row as Record<string, string | null>, requiredFields);
          expect(status).toBe("complete");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'partial' when some but not all required fields are filled", () => {
    // Only test entity types with 2+ required fields (otherwise partial is impossible)
    const multiFieldTypes = ALL_ENTITY_TYPES_P1.filter((et) => REQUIRED_FIELDS[et].length >= 2);
    const multiFieldGen = fc.constantFrom(...multiFieldTypes);

    fc.assert(
      fc.property(
        multiFieldGen.chain((et) => {
          const fields = REQUIRED_FIELDS[et];
          // Pick a random non-empty, non-full subset of fields to fill
          return fc
            .subarray(fields, { minLength: 1, maxLength: fields.length - 1 })
            .chain((filledFields) =>
              fc.tuple(
                fc.constant(et),
                fc.constant(filledFields),
                // Generate non-empty values for the filled fields
                fc.tuple(...filledFields.map(() => filledStringGen))
              )
            );
        }),
        ([entityType, filledFields, values]) => {
          const requiredFields = REQUIRED_FIELDS[entityType];
          const row: Record<string, string | null> = {};
          // Set filled fields to generated values
          filledFields.forEach((f, i) => {
            row[f] = values[i];
          });
          // Set remaining required fields to null
          for (const f of requiredFields) {
            if (!(f in row)) row[f] = null;
          }
          const status = classifyStatus(row, requiredFields);
          expect(status).toBe("partial");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'missing' when all required fields are empty or null", () => {
    /** Generate either null, empty string, or whitespace-only string */
    const emptyValueGen = fc.constantFrom(null, "", "   ", "\t", "\n");

    fc.assert(
      fc.property(
        entityTypeGenP1.chain((et) =>
          fc.tuple(
            fc.constant(et),
            fc.record(Object.fromEntries(REQUIRED_FIELDS[et].map((f) => [f, emptyValueGen])))
          )
        ),
        ([entityType, row]) => {
          const requiredFields = REQUIRED_FIELDS[entityType];
          const status = classifyStatus(row as Record<string, string | null>, requiredFields);
          expect(status).toBe("missing");
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: admin-translation-management, Property 2: Invariant des statistiques de traduction
 *
 * _For any_ entity type and _for any_ supported language, the sum
 * complete + partial + missing must equal total, and percentage must equal
 * Math.round((complete / total) * 100) (or 100 if total is 0).
 *
 * **Validates: Requirements 2.2**
 */

const ALL_ENTITY_TYPES_P2: EntityType[] = [
  "games",
  "characters",
  "genres",
  "companies",
  "platforms",
  "character_roles",
  "genders",
  "species",
  "content_descriptors",
  "ratings",
];

const entityTypeGenP2 = fc.constantFrom(...ALL_ENTITY_TYPES_P2);

const langGenP2 = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .map(([a, b]) => `${a}${b}`);

/**
 * Generate a valid TranslationStats object where:
 * - total is a positive integer (1..10000)
 * - complete, partial, missing are non-negative integers that sum to total
 * - percentage = Math.round((complete / total) * 100)
 */
function translationStatsGen(
  entityType: EntityType,
  language: string
): fc.Arbitrary<TranslationStats> {
  return fc.integer({ min: 1, max: 10000 }).chain((total) =>
    // Generate two cut points to split total into 3 non-negative parts
    fc
      .tuple(fc.integer({ min: 0, max: total }), fc.integer({ min: 0, max: total }))
      .map(([a, b]) => {
        const sorted = [a, b].sort((x, y) => x - y);
        const complete = sorted[0];
        const partial = sorted[1] - sorted[0];
        const missing = total - sorted[1];
        const percentage = Math.round((complete / total) * 100);
        return {
          entityType,
          language,
          total,
          complete,
          partial,
          missing,
          percentage,
        } satisfies TranslationStats;
      })
  );
}

/** Generate a TranslationStats with total = 0 (edge case) */
function zeroTotalStatsGen(
  entityType: EntityType,
  language: string
): fc.Arbitrary<TranslationStats> {
  return fc.constant({
    entityType,
    language,
    total: 0,
    complete: 0,
    partial: 0,
    missing: 0,
    percentage: 100,
  } satisfies TranslationStats);
}

describe("Feature: admin-translation-management, Property 2: Invariant des statistiques de traduction", () => {
  it("complete + partial + missing === total AND percentage === Math.round((complete / total) * 100) for any stats with total > 0", () => {
    fc.assert(
      fc.property(
        entityTypeGenP2.chain((et) => langGenP2.chain((lang) => translationStatsGen(et, lang))),
        (stats) => {
          // Invariant 1: sum must equal total
          expect(stats.complete + stats.partial + stats.missing).toBe(stats.total);

          // Invariant 2: percentage must match formula
          const expectedPercentage = Math.round((stats.complete / stats.total) * 100);
          expect(stats.percentage).toBe(expectedPercentage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("when total is 0, percentage must be 100 and all counts must be 0", () => {
    fc.assert(
      fc.property(
        entityTypeGenP2.chain((et) => langGenP2.chain((lang) => zeroTotalStatsGen(et, lang))),
        (stats) => {
          expect(stats.total).toBe(0);
          expect(stats.complete).toBe(0);
          expect(stats.partial).toBe(0);
          expect(stats.missing).toBe(0);
          expect(stats.percentage).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
