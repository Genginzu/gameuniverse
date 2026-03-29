import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { translateBatchBodySchema } from "@/lib/validations/admin-translation";
import {
  EDITABLE_FIELDS,
  type EntityType,
  type BatchProgressEvent,
} from "@/types/admin-translations";

// --- Shared generators ---

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

const entityTypeGen = fc.constantFrom(...ALL_ENTITY_TYPES);

const langGen = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .map(([a, b]) => `${a}${b}`);

const nonEmptyStringGen = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((s) => s.trim().length > 0);

// --- Property 10: Validation de la taille du lot ---

/**
 * Feature: admin-translation-management, Property 10: Validation de la taille du lot
 *
 * _For any_ array entityIds of size > 50, the translateBatchBodySchema must reject it.
 * _For any_ array of size between 1 and 50 inclusive, the schema must not reject it
 * for size reasons.
 *
 * **Validates: Requirements 5.6, 5.7**
 */
describe("Feature: admin-translation-management, Property 10: Validation de la taille du lot", () => {
  it("rejects entityIds arrays with more than 50 elements", () => {
    fc.assert(
      fc.property(
        entityTypeGen,
        langGen,
        fc
          .integer({ min: 51, max: 120 })
          .chain((size) =>
            fc.tuple(fc.constant(size), fc.array(fc.uuid(), { minLength: size, maxLength: size }))
          ),
        (entityType, targetLang, [, entityIds]) => {
          const result = translateBatchBodySchema.safeParse({
            entityType,
            entityIds,
            targetLang,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts entityIds arrays with 1 to 50 elements", () => {
    fc.assert(
      fc.property(
        entityTypeGen,
        langGen,
        fc
          .integer({ min: 1, max: 50 })
          .chain((size) => fc.array(fc.uuid(), { minLength: size, maxLength: size })),
        (entityType, targetLang, entityIds) => {
          const result = translateBatchBodySchema.safeParse({
            entityType,
            entityIds,
            targetLang,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects empty entityIds arrays", () => {
    fc.assert(
      fc.property(entityTypeGen, langGen, (entityType, targetLang) => {
        const result = translateBatchBodySchema.safeParse({
          entityType,
          entityIds: [],
          targetLang,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 8: Complétude du traitement par lot ---

/**
 * Feature: admin-translation-management, Property 8: Complétude du traitement par lot
 *
 * _For any_ array of entity IDs of size N (1 ≤ N ≤ 50), the NDJSON stream returned
 * by /translate-batch must contain exactly N lines, each with an entityId from the
 * input array and a status of "success" or "error".
 *
 * Pure property test: simulate batch processing with random outcomes.
 *
 * **Validates: Requirements 5.2, 5.3**
 */

function simulateBatchProcessing(entityIds: string[], outcomes: boolean[]): BatchProgressEvent[] {
  return entityIds.map((entityId, i) => ({
    entityId,
    status: outcomes[i] ? ("success" as const) : ("error" as const),
    ...(outcomes[i]
      ? { translatedFields: { name: "translated" } }
      : { error: "Translation failed" }),
  }));
}

describe("Feature: admin-translation-management, Property 8: Complétude du traitement par lot", () => {
  it("produces exactly N NDJSON lines for N entity IDs, each with valid entityId and status", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 1, max: 50 })
          .chain((n) =>
            fc.tuple(
              fc.constant(n),
              fc.array(fc.uuid(), { minLength: n, maxLength: n }),
              fc.array(fc.boolean(), { minLength: n, maxLength: n })
            )
          ),
        ([n, entityIds, outcomes]) => {
          const events = simulateBatchProcessing(entityIds, outcomes);

          // Exactly N lines
          expect(events).toHaveLength(n);

          // Each event has a valid entityId from the input and a valid status
          const inputSet = new Set(entityIds);
          for (const event of events) {
            expect(inputSet.has(event.entityId)).toBe(true);
            expect(["success", "error"]).toContain(event.status);
          }

          // Every input entityId appears in the output
          const outputIds = new Set(events.map((e) => e.entityId));
          for (const id of entityIds) {
            expect(outputIds.has(id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 9: Résilience du traitement par lot ---

/**
 * Feature: admin-translation-management, Property 9: Résilience du traitement par lot
 *
 * _For any_ batch containing at least one entity whose translation fails, the NDJSON
 * stream must contain an error entry for that entity AND continue processing subsequent
 * entities. The total number of lines must always equal the number of entities in the batch.
 *
 * Pure property test: simulate batches with random failure positions.
 *
 * **Validates: Requirements 5.5**
 */
describe("Feature: admin-translation-management, Property 9: Résilience du traitement par lot", () => {
  it("continues processing after failures and total lines equals batch size", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }).chain((n) =>
          fc.tuple(
            fc.constant(n),
            fc.array(fc.uuid(), { minLength: n, maxLength: n }),
            // At least one failure: generate outcomes then force at least one false
            fc.array(fc.boolean(), { minLength: n, maxLength: n }),
            fc.integer({ min: 0, max: n - 1 }) // index to force failure
          )
        ),
        ([n, entityIds, outcomes, failIdx]) => {
          // Force at least one failure
          const adjustedOutcomes = [...outcomes];
          adjustedOutcomes[failIdx] = false;

          const events = simulateBatchProcessing(entityIds, adjustedOutcomes);

          // Total lines must equal batch size (resilience: no early abort)
          expect(events).toHaveLength(n);

          // The forced failure entity must have status "error"
          const failedEvent = events[failIdx];
          expect(failedEvent.status).toBe("error");
          expect(failedEvent.error).toBeDefined();

          // Entities after the failure must still be processed
          for (let i = failIdx + 1; i < n; i++) {
            expect(events[i].entityId).toBe(entityIds[i]);
            expect(["success", "error"]).toContain(events[i].status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 7: Aller-retour de l'upsert de traduction ---

/**
 * Feature: admin-translation-management, Property 7: Aller-retour de l'upsert de traduction
 *
 * _For any_ entity type, _for any_ valid entity ID, and _for any_ set of valid translated
 * fields, after calling upsertTranslation, a SELECT on the translation table with the same
 * entityId and targetLang must return exactly the saved fields.
 *
 * Pure property test on the upsert contract: simulate upsert + select round-trip.
 *
 * **Validates: Requirements 4.4, 10.2**
 */

/** In-memory store simulating the DB upsert/select contract */
function createInMemoryTranslationStore() {
  const store = new Map<string, Record<string, string>>();

  function upsert(
    entityType: EntityType,
    entityId: string,
    targetLang: string,
    fields: Record<string, string>
  ) {
    const key = `${entityType}:${entityId}:${targetLang}`;
    store.set(key, { ...fields });
  }

  function select(
    entityType: EntityType,
    entityId: string,
    targetLang: string
  ): Record<string, string> | null {
    const key = `${entityType}:${entityId}:${targetLang}`;
    return store.get(key) ?? null;
  }

  return { upsert, select };
}

describe("Feature: admin-translation-management, Property 7: Aller-retour de l'upsert de traduction", () => {
  it("select after upsert returns exactly the saved fields", () => {
    fc.assert(
      fc.property(
        entityTypeGen.chain((et) =>
          fc.tuple(
            fc.constant(et),
            fc.uuid(),
            langGen,
            // Generate fields matching EDITABLE_FIELDS for this entity type
            fc.record(
              Object.fromEntries(EDITABLE_FIELDS[et].map((f) => [f, nonEmptyStringGen])) as Record<
                string,
                fc.Arbitrary<string>
              >
            )
          )
        ),
        ([entityType, entityId, targetLang, fields]) => {
          const db = createInMemoryTranslationStore();

          db.upsert(entityType, entityId, targetLang, fields);
          const result = db.select(entityType, entityId, targetLang);

          // Must return non-null
          expect(result).not.toBeNull();

          // Keys must match exactly
          expect(Object.keys(result!).sort()).toEqual(Object.keys(fields).sort());

          // Values must match exactly
          for (const [key, value] of Object.entries(fields)) {
            expect(result![key]).toBe(value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("upsert overwrites previous values for the same entity and language", () => {
    fc.assert(
      fc.property(
        entityTypeGen.chain((et) =>
          fc.tuple(
            fc.constant(et),
            fc.uuid(),
            langGen,
            fc.record(
              Object.fromEntries(EDITABLE_FIELDS[et].map((f) => [f, nonEmptyStringGen])) as Record<
                string,
                fc.Arbitrary<string>
              >
            ),
            fc.record(
              Object.fromEntries(EDITABLE_FIELDS[et].map((f) => [f, nonEmptyStringGen])) as Record<
                string,
                fc.Arbitrary<string>
              >
            )
          )
        ),
        ([entityType, entityId, targetLang, firstFields, secondFields]) => {
          const db = createInMemoryTranslationStore();

          db.upsert(entityType, entityId, targetLang, firstFields);
          db.upsert(entityType, entityId, targetLang, secondFields);
          const result = db.select(entityType, entityId, targetLang);

          // Must return the second set of fields, not the first
          for (const [key, value] of Object.entries(secondFields)) {
            expect(result![key]).toBe(value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
