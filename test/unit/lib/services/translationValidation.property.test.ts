import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { saveTranslationBodySchema } from "@/lib/validations/admin-translation";

/**
 * Feature: admin-translation-management, Property 11: Validation Zod des entrées
 *
 * _For any_ request body not matching saveTranslationBodySchema
 * (invalid entityType, non-UUID entityId, targetLang length ≠ 2, or missing translations),
 * the validation must fail.
 *
 * **Validates: Requirements 10.3, 10.4**
 */

// --- Valid generators ---

const VALID_ENTITY_TYPES = [
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
] as const;

const validEntityTypeGenerator = fc.constantFrom(...VALID_ENTITY_TYPES);

const validUuidGenerator = fc.uuid();

const validTargetLangGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .map(([a, b]) => `${a}${b}`);

const validTranslationsGenerator = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  fc.string({ minLength: 1, maxLength: 200 }),
  { minKeys: 1, maxKeys: 5 }
);

const validBodyGenerator = fc
  .tuple(
    validEntityTypeGenerator,
    validUuidGenerator,
    validTargetLangGenerator,
    validTranslationsGenerator
  )
  .map(([entityType, entityId, targetLang, translations]) => ({
    entityType,
    entityId,
    targetLang,
    translations,
  }));

// --- Invalid generators ---

/** Generates an entityType NOT in the valid list */
const invalidEntityTypeGenerator = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !(VALID_ENTITY_TYPES as readonly string[]).includes(s));

/** Generates a string that is NOT a valid UUID */
const invalidUuidGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("not-a-uuid"),
  fc.constant("12345"),
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => {
    // Reject anything that looks like a valid UUID v4
    return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  })
);

/** Generates a targetLang with length ≠ 2 */
const invalidTargetLangGenerator = fc.oneof(
  fc.constant(""),
  fc.string({ minLength: 1, maxLength: 1 }),
  fc.string({ minLength: 3, maxLength: 10 })
);

// --- Tests ---

describe("Translation Validation - Property-Based Tests", () => {
  describe("Feature: admin-translation-management, Property 11: Validation Zod des entrées", () => {
    it("accepts all valid saveTranslationBody data", () => {
      fc.assert(
        fc.property(validBodyGenerator, (body) => {
          const result = saveTranslationBodySchema.safeParse(body);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects invalid entityType values", () => {
      fc.assert(
        fc.property(
          invalidEntityTypeGenerator,
          validUuidGenerator,
          validTargetLangGenerator,
          validTranslationsGenerator,
          (entityType, entityId, targetLang, translations) => {
            const result = saveTranslationBodySchema.safeParse({
              entityType,
              entityId,
              targetLang,
              translations,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects non-UUID entityId values", () => {
      fc.assert(
        fc.property(
          validEntityTypeGenerator,
          invalidUuidGenerator,
          validTargetLangGenerator,
          validTranslationsGenerator,
          (entityType, entityId, targetLang, translations) => {
            const result = saveTranslationBodySchema.safeParse({
              entityType,
              entityId,
              targetLang,
              translations,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects targetLang with length ≠ 2", () => {
      fc.assert(
        fc.property(
          validEntityTypeGenerator,
          validUuidGenerator,
          invalidTargetLangGenerator,
          validTranslationsGenerator,
          (entityType, entityId, targetLang, translations) => {
            const result = saveTranslationBodySchema.safeParse({
              entityType,
              entityId,
              targetLang,
              translations,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects body with missing translations field", () => {
      fc.assert(
        fc.property(
          validEntityTypeGenerator,
          validUuidGenerator,
          validTargetLangGenerator,
          (entityType, entityId, targetLang) => {
            const result = saveTranslationBodySchema.safeParse({
              entityType,
              entityId,
              targetLang,
              // translations intentionally omitted
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects body with non-object translations", () => {
      fc.assert(
        fc.property(
          validEntityTypeGenerator,
          validUuidGenerator,
          validTargetLangGenerator,
          fc.oneof(
            fc.constant(null),
            fc.constant(42),
            fc.constant("string"),
            fc.constant(true),
            fc.array(fc.string())
          ),
          (entityType, entityId, targetLang, translations) => {
            const result = saveTranslationBodySchema.safeParse({
              entityType,
              entityId,
              targetLang,
              translations,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("provides descriptive error messages for all invalid inputs", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Invalid entityType
            fc.tuple(
              invalidEntityTypeGenerator,
              validUuidGenerator,
              validTargetLangGenerator,
              validTranslationsGenerator
            ),
            // Invalid entityId
            fc.tuple(
              validEntityTypeGenerator,
              invalidUuidGenerator,
              validTargetLangGenerator,
              validTranslationsGenerator
            ),
            // Invalid targetLang
            fc.tuple(
              validEntityTypeGenerator,
              validUuidGenerator,
              invalidTargetLangGenerator,
              validTranslationsGenerator
            )
          ),
          ([entityType, entityId, targetLang, translations]) => {
            const result = saveTranslationBodySchema.safeParse({
              entityType,
              entityId,
              targetLang,
              translations,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.issues.length).toBeGreaterThan(0);
              for (const issue of result.error.issues) {
                expect(typeof issue.message).toBe("string");
                expect(issue.message.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Feature: admin-translation-management, Property 13: Correspondance des champs éditables par type d'entité
 *
 * For any entity type, the editable fields displayed in the review modal must correspond
 * exactly to the keys defined in EDITABLE_FIELDS[entityType].
 *
 * **Validates: Requirements 9.4**
 */

import { EntityType, EDITABLE_FIELDS, REQUIRED_FIELDS } from "@/types/admin-translations";

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

describe("Feature: admin-translation-management, Property 13: Correspondance des champs éditables par type d'entité", () => {
  it("EDITABLE_FIELDS contains a non-empty array for every entity type", () => {
    fc.assert(
      fc.property(entityTypeGenerator, (entityType) => {
        const fields = EDITABLE_FIELDS[entityType];
        expect(Array.isArray(fields)).toBe(true);
        expect(fields.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("REQUIRED_FIELDS is always a subset of EDITABLE_FIELDS for each entity type", () => {
    fc.assert(
      fc.property(entityTypeGenerator, (entityType) => {
        const required = REQUIRED_FIELDS[entityType];
        const editable = EDITABLE_FIELDS[entityType];
        for (const field of required) {
          expect(editable).toContain(field);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("every field in EDITABLE_FIELDS is a non-empty string", () => {
    fc.assert(
      fc.property(entityTypeGenerator, (entityType) => {
        const fields = EDITABLE_FIELDS[entityType];
        for (const field of fields) {
          expect(typeof field).toBe("string");
          expect(field.trim().length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: admin-translation-management, Property 12: Synchronisation des clés i18n
 *
 * For any key present in fr.json under the namespace admin.translations,
 * the same key must exist in en.json under the same namespace, and vice versa.
 *
 * **Validates: Requirements 6.10, 9.8, 12.2, 12.4**
 */

import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

/** Recursively flatten nested object keys into dot-separated paths */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** Resolve a dot-separated key path in a nested object */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

const frTranslations = (frMessages as Record<string, unknown>).admin as Record<string, unknown>;
const enTranslations = (enMessages as Record<string, unknown>).admin as Record<string, unknown>;

const frAdminTranslationsObj = frTranslations.translations as Record<string, unknown>;
const enAdminTranslationsObj = enTranslations.translations as Record<string, unknown>;

const frKeys = flattenKeys(frAdminTranslationsObj);
const enKeys = flattenKeys(enAdminTranslationsObj);

describe("Feature: admin-translation-management, Property 12: Synchronisation des clés i18n", () => {
  it("every fr.json admin.translations key exists in en.json", () => {
    expect(frKeys.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(fc.constantFrom(...frKeys), (key) => {
        const enValue = getNestedValue(enAdminTranslationsObj, key);
        expect(enValue).toBeDefined();
        expect(typeof enValue).toBe("string");
      }),
      { numRuns: 100 }
    );
  });

  it("every en.json admin.translations key exists in fr.json", () => {
    expect(enKeys.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(fc.constantFrom(...enKeys), (key) => {
        const frValue = getNestedValue(frAdminTranslationsObj, key);
        expect(frValue).toBeDefined();
        expect(typeof frValue).toBe("string");
      }),
      { numRuns: 100 }
    );
  });

  it("fr.json and en.json have the exact same set of admin.translations keys", () => {
    const frSorted = [...frKeys].sort();
    const enSorted = [...enKeys].sort();
    expect(frSorted).toEqual(enSorted);
  });
});
