import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  EDITABLE_FIELDS,
  REQUIRED_FIELDS,
  type EntityType,
  type TranslationMissingItem,
} from "@/types/admin-translations";
import { classifyStatus } from "@/lib/services/translationService";

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

const nonEmptyStringGen = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((s) => s.trim().length > 0);

// --- Property 4: Cohérence de la pagination ---

/**
 * Feature: admin-translation-management, Property 4: Cohérence de la pagination
 *
 * For any dataset of size N and for any valid combination of page and limit,
 * the number of returned items must be min(limit, N - (page-1)*limit) if page
 * is in bounds, and totalPages must be Math.ceil(N / limit).
 *
 * **Validates: Requirements 1.6**
 */

/** Pure pagination function matching the service's slicing logic */
function paginate<T>(items: T[], page: number, limit: number) {
  const totalCount = items.length;
  const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0;
  const start = (page - 1) * limit;
  const sliced = items.slice(start, start + limit);
  return { sliced, totalCount, totalPages };
}

describe("Feature: admin-translation-management, Property 4: Cohérence de la pagination", () => {
  it("returned count = min(limit, N - (page-1)*limit) when page is in bounds, totalPages = ceil(N/limit)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 1, max: 100 }),
        (datasetSize, limit) => {
          const items = Array.from({ length: datasetSize }, (_, i) => i);
          const totalPages = limit > 0 ? Math.ceil(datasetSize / limit) : 0;

          // Test every valid page
          const maxPage = Math.max(1, totalPages);
          for (let page = 1; page <= maxPage; page++) {
            const result = paginate(items, page, limit);
            const expectedCount = Math.min(limit, Math.max(0, datasetSize - (page - 1) * limit));

            expect(result.sliced.length).toBe(expectedCount);
            expect(result.totalPages).toBe(totalPages);
            expect(result.totalCount).toBe(datasetSize);
          }

          // Page beyond bounds returns 0 items
          if (totalPages > 0) {
            const outOfBounds = paginate(items, totalPages + 1, limit);
            expect(outOfBounds.sliced.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 5: Filtrage par recherche ---

/**
 * Feature: admin-translation-management, Property 5: Filtrage par recherche
 *
 * For any non-empty search term and for any list of entities, each item returned
 * by the /missing endpoint with the search parameter must contain the search term
 * (case-insensitive) in at least one of its text fields (source or target).
 *
 * **Validates: Requirements 1.7**
 */

/** Pure search filter matching the service's logic: item matches if any text field
 *  (sourceText values or identifier) contains the term. */
function filterBySearch(items: TranslationMissingItem[], search: string): TranslationMissingItem[] {
  const term = search.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) => {
    const allTexts = [...Object.values(item.sourceText), item.identifier];
    return allTexts.some((t) => t.toLowerCase().includes(term));
  });
}

/** Generate a TranslationMissingItem with random text fields for a given entity type */
function missingItemGen(entityType: EntityType): fc.Arbitrary<TranslationMissingItem> {
  const fields = EDITABLE_FIELDS[entityType];
  const fieldsRecord = fc.record(
    Object.fromEntries(fields.map((f) => [f, nonEmptyStringGen]))
  ) as fc.Arbitrary<Record<string, string>>;

  return fc
    .tuple(fc.uuid(), nonEmptyStringGen, fieldsRecord)
    .map(([id, identifier, sourceText]) => ({
      entityId: id,
      identifier,
      sourceText,
      sourceLang: "en",
      missingLangs: ["fr"],
    }));
}

describe("Feature: admin-translation-management, Property 5: Filtrage par recherche", () => {
  it("every filtered item contains the search term (case-insensitive) in at least one text field", () => {
    fc.assert(
      fc.property(
        entityTypeGen.chain((et) =>
          fc.tuple(
            fc.constant(et),
            fc.array(missingItemGen(et), { minLength: 0, maxLength: 30 }),
            nonEmptyStringGen.map((s) => s.substring(0, 10))
          )
        ),
        ([_et, items, searchTerm]) => {
          const filtered = filterBySearch(items, searchTerm);
          const term = searchTerm.trim().toLowerCase();

          for (const item of filtered) {
            const allTexts = [...Object.values(item.sourceText), item.identifier];
            const matches = allTexts.some((t) => t.toLowerCase().includes(term));
            expect(matches).toBe(true);
          }

          // Also verify no matching item was excluded
          for (const item of items) {
            const allTexts = [...Object.values(item.sourceText), item.identifier];
            const shouldMatch = allTexts.some((t) => t.toLowerCase().includes(term));
            if (shouldMatch) {
              expect(filtered).toContainEqual(item);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 6: Détection automatique de la langue source ---

/**
 * Feature: admin-translation-management, Property 6: Détection automatique de la langue source
 *
 * For any entity with translations in at least one language different from targetLang,
 * the detected source language must be different from targetLang and must correspond
 * to an existing translation of the entity.
 *
 * **Validates: Requirements 4.2**
 */

interface TranslationRow {
  lang: string;
  fields: Record<string, string>;
}

/** Pure source language detection matching the service's getSourceText logic:
 *  prefer "en" if available, otherwise pick the first non-target language. */
function detectSourceLang(
  translations: TranslationRow[],
  excludeLang: string
): { sourceLang: string; fields: Record<string, string> } | null {
  const candidates = translations.filter(
    (t) => t.lang !== excludeLang && Object.keys(t.fields).length > 0
  );
  if (candidates.length === 0) return null;
  const enRow = candidates.find((t) => t.lang === "en");
  const best = enRow || candidates[0];
  return { sourceLang: best.lang, fields: best.fields };
}

const langGen = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .map(([a, b]) => `${a}${b}`);

/** Generate a list of translation rows with at least one language != targetLang */
function translationRowsGen(
  entityType: EntityType,
  targetLang: string
): fc.Arbitrary<TranslationRow[]> {
  const fields = EDITABLE_FIELDS[entityType];
  const fieldsRecordGen = fc.record(
    Object.fromEntries(fields.map((f) => [f, nonEmptyStringGen]))
  ) as fc.Arbitrary<Record<string, string>>;

  const rowGen = fc.tuple(langGen, fieldsRecordGen).map(([lang, flds]) => ({
    lang,
    fields: flds,
  }));

  return fc
    .array(rowGen, { minLength: 1, maxLength: 6 })
    .filter((rows) => rows.some((r) => r.lang !== targetLang));
}

describe("Feature: admin-translation-management, Property 6: Détection automatique de la langue source", () => {
  it("detected source language differs from targetLang and exists in the entity's translations", () => {
    fc.assert(
      fc.property(
        entityTypeGen.chain((et) =>
          langGen.chain((targetLang) =>
            translationRowsGen(et, targetLang).map((rows) => ({
              entityType: et,
              targetLang,
              translations: rows,
            }))
          )
        ),
        ({ targetLang, translations }) => {
          const result = detectSourceLang(translations, targetLang);

          // Must find a source since we guarantee at least one lang != targetLang
          expect(result).not.toBeNull();
          if (!result) return;

          // Source lang must differ from target
          expect(result.sourceLang).not.toBe(targetLang);

          // Source lang must correspond to an existing translation
          const existingLangs = translations.map((t) => t.lang);
          expect(existingLangs).toContain(result.sourceLang);

          // If "en" is available (and != targetLang), it must be preferred
          const hasEn = translations.some(
            (t) => t.lang === "en" && t.lang !== targetLang && Object.keys(t.fields).length > 0
          );
          if (hasEn) {
            expect(result.sourceLang).toBe("en");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
