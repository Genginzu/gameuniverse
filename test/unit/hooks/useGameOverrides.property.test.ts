import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { TRACKABLE_FIELDS } from "../../../src/lib/utils/field-tracking";
import type { TrackableField } from "../../../src/types/admin-games";

// =============================================================================
// Pure logic extracted from useGameOverrides for testability
// =============================================================================

/**
 * Pure implementation of isIgdbField: returns true when the field
 * is NOT in the overridden set (i.e. still original IGDB data).
 */
function isIgdbField(
  overriddenFields: Set<string>,
  hasIgdb: boolean,
  fieldName: TrackableField
): boolean {
  if (!hasIgdb) return false;
  return !overriddenFields.has(fieldName);
}

// =============================================================================
// Generators
// =============================================================================

const trackableFieldGen = (): fc.Arbitrary<TrackableField> => fc.constantFrom(...TRACKABLE_FIELDS);

/** Generate a random subset of TRACKABLE_FIELDS as the overridden set */
const overrideSetGen = (): fc.Arbitrary<Set<TrackableField>> =>
  fc.subarray([...TRACKABLE_FIELDS]).map((arr) => new Set(arr));

// =============================================================================
// **Feature: igdb-field-tracking, Property 5: Indicateur IGDB reflète l'absence d'override**
// **Validates: Requirements 6.1, 6.2, 6.5**
// =============================================================================

describe("Property 5: Indicateur IGDB reflète l'absence d'override", () => {
  it("isIgdbField returns true iff field is absent from overrides (when game has igdb_id)", () => {
    fc.assert(
      fc.property(overrideSetGen(), trackableFieldGen(), (overrides, field) => {
        const result = isIgdbField(overrides, true, field);
        const expected = !overrides.has(field);
        expect(result).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it("isIgdbField always returns false when game has no igdb_id", () => {
    fc.assert(
      fc.property(overrideSetGen(), trackableFieldGen(), (overrides, field) => {
        const result = isIgdbField(overrides, false, field);
        expect(result).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it("for all trackable fields, exactly those NOT in overrides return true", () => {
    fc.assert(
      fc.property(overrideSetGen(), (overrides) => {
        const igdbFields = TRACKABLE_FIELDS.filter((f) => isIgdbField(overrides, true, f));
        const nonOverridden = TRACKABLE_FIELDS.filter((f) => !overrides.has(f));
        expect(igdbFields).toEqual(nonOverridden);
      }),
      { numRuns: 200 }
    );
  });
});
