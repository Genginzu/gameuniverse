import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  shouldTriggerSearch,
  createDebouncedCallback,
} from "../../../../src/components/shared/SearchBar";
import {
  hasActiveFilters,
  countActiveFilters,
  toggleFilterValue,
  type FilterConfig,
  type FilterOption,
} from "../../../../src/components/shared/FilterPanel";

// Feature: test-reorganization
// **Property: Prop Rendering Consistency**
// _For any_ valid prop combination, component should render without errors
// **Validates: Requirements 8.4**

describe("Component Props Property-Based Tests", () => {
  describe("Property: Prop Rendering Consistency", () => {
    describe("SearchBar props validation", () => {
      // Generator for valid search queries
      const searchQueryGenerator = fc.string({ minLength: 0, maxLength: 200 });

      // Generator for valid debounce values
      const debounceGenerator = fc.integer({ min: 0, max: 5000 });

      // Generator for valid minQueryLength
      const minQueryLengthGenerator = fc.integer({ min: 0, max: 20 });

      it("shouldTriggerSearch returns boolean for any valid inputs", () => {
        fc.assert(
          fc.property(searchQueryGenerator, minQueryLengthGenerator, (query, minLength) => {
            const result = shouldTriggerSearch(query, minLength);
            return typeof result === "boolean";
          }),
          { numRuns: 30 }
        );
      });

      it("shouldTriggerSearch is consistent with query length comparison", () => {
        fc.assert(
          fc.property(searchQueryGenerator, minQueryLengthGenerator, (query, minLength) => {
            const result = shouldTriggerSearch(query, minLength);
            const expected = query.length >= minLength;
            return result === expected;
          }),
          { numRuns: 30 }
        );
      });

      it("createDebouncedCallback returns valid structure for any delay", () => {
        fc.assert(
          fc.property(debounceGenerator, (delay) => {
            const callback = () => {};
            const result = createDebouncedCallback(callback, delay);
            return (
              typeof result === "object" &&
              typeof result.debouncedFn === "function" &&
              typeof result.cancel === "function"
            );
          }),
          { numRuns: 30 }
        );
      });

      it("search trigger threshold is monotonic with minLength", () => {
        fc.assert(
          fc.property(
            searchQueryGenerator,
            fc.integer({ min: 0, max: 10 }),
            fc.integer({ min: 0, max: 10 }),
            (query, minLength1, minLength2) => {
              const result1 = shouldTriggerSearch(query, minLength1);
              const result2 = shouldTriggerSearch(query, minLength2);

              // If minLength1 <= minLength2 and result2 is true, then result1 must be true
              if (minLength1 <= minLength2 && result2) {
                return result1 === true;
              }
              return true;
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe("FilterPanel props validation", () => {
      // Generator for filter option IDs
      const filterOptionIdGenerator = fc.stringMatching(/^[a-z0-9-]{1,20}$/);

      // Generator for filter option
      const filterOptionGenerator: fc.Arbitrary<FilterOption> = fc.record({
        id: filterOptionIdGenerator,
        label: fc.string({ minLength: 1, maxLength: 50 }),
        count: fc.option(fc.integer({ min: 0, max: 10000 })),
      });

      // Generator for filter config
      const filterConfigGenerator: fc.Arbitrary<FilterConfig> = fc.record({
        id: filterOptionIdGenerator,
        label: fc.string({ minLength: 1, maxLength: 50 }),
        type: fc.constantFrom("checkbox" as const, "radio" as const),
        options: fc.array(filterOptionGenerator, { minLength: 1, maxLength: 20 }),
        collapsible: fc.option(fc.boolean()),
        defaultExpanded: fc.option(fc.boolean()),
      });

      // Generator for active filters
      const activeFiltersGenerator = fc.dictionary(
        filterOptionIdGenerator,
        fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 })
      );

      it("hasActiveFilters returns boolean for any valid activeFilters", () => {
        fc.assert(
          fc.property(activeFiltersGenerator, (activeFilters) => {
            const result = hasActiveFilters(activeFilters);
            return typeof result === "boolean";
          }),
          { numRuns: 30 }
        );
      });

      it("countActiveFilters returns non-negative integer for any valid activeFilters", () => {
        fc.assert(
          fc.property(activeFiltersGenerator, (activeFilters) => {
            const result = countActiveFilters(activeFilters);
            return typeof result === "number" && result >= 0 && Number.isInteger(result);
          }),
          { numRuns: 30 }
        );
      });

      it("countActiveFilters equals sum of all array lengths", () => {
        fc.assert(
          fc.property(activeFiltersGenerator, (activeFilters) => {
            const result = countActiveFilters(activeFilters);
            const expected = Object.values(activeFilters).reduce(
              (sum, values) => sum + values.length,
              0
            );
            return result === expected;
          }),
          { numRuns: 30 }
        );
      });

      it("hasActiveFilters is true iff countActiveFilters > 0", () => {
        fc.assert(
          fc.property(activeFiltersGenerator, (activeFilters) => {
            const hasFilters = hasActiveFilters(activeFilters);
            const count = countActiveFilters(activeFilters);
            return hasFilters === count > 0;
          }),
          { numRuns: 30 }
        );
      });

      it("toggleFilterValue in checkbox mode preserves array length invariant", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 }),
            filterOptionIdGenerator,
            (currentValues, value) => {
              // Deduplicate: toggleFilterValue uses filter() which removes ALL occurrences
              const uniqueValues = [...new Set(currentValues)];
              const result = toggleFilterValue(uniqueValues, value, "checkbox");

              // If value was in uniqueValues, result should have one less
              // If value was not in uniqueValues, result should have one more
              const wasPresent = uniqueValues.includes(value);
              const expectedLength = wasPresent
                ? uniqueValues.length - 1
                : uniqueValues.length + 1;

              return result.length === expectedLength;
            }
          ),
          { numRuns: 30 }
        );
      });

      it("toggleFilterValue in radio mode always returns single-element array", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 }),
            filterOptionIdGenerator,
            (currentValues, value) => {
              const result = toggleFilterValue(currentValues, value, "radio");
              return result.length === 1 && result[0] === value;
            }
          ),
          { numRuns: 30 }
        );
      });

      it("toggleFilterValue is idempotent for radio mode", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 }),
            filterOptionIdGenerator,
            (currentValues, value) => {
              const result1 = toggleFilterValue(currentValues, value, "radio");
              const result2 = toggleFilterValue(result1, value, "radio");
              return result1.length === result2.length && result1[0] === result2[0];
            }
          ),
          { numRuns: 30 }
        );
      });

      it("toggleFilterValue twice in checkbox mode returns to original state", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 }),
            filterOptionIdGenerator,
            (currentValues, value) => {
              // Ensure unique values for predictable behavior
              const uniqueValues = [...new Set(currentValues)];
              const result1 = toggleFilterValue(uniqueValues, value, "checkbox");
              const result2 = toggleFilterValue(result1, value, "checkbox");

              // After toggling twice, we should have the same values
              const sortedOriginal = [...uniqueValues].sort();
              const sortedResult = [...result2].sort();

              return (
                sortedOriginal.length === sortedResult.length &&
                sortedOriginal.every((v, i) => v === sortedResult[i])
              );
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe("Cross-component prop consistency", () => {
      it("empty state is consistent across components", () => {
        fc.assert(
          fc.property(fc.constant({}), (emptyFilters) => {
            const hasFilters = hasActiveFilters(emptyFilters);
            const count = countActiveFilters(emptyFilters);
            const searchTriggers = shouldTriggerSearch("", 1);

            // All should indicate "empty" or "inactive" state
            return hasFilters === false && count === 0 && searchTriggers === false;
          }),
          { numRuns: 10 }
        );
      });

      it("filter operations maintain data integrity", () => {
        fc.assert(
          fc.property(
            fc.stringMatching(/^[a-z0-9-]{1,10}$/),
            fc.array(fc.stringMatching(/^[a-z0-9-]{1,10}$/), { minLength: 0, maxLength: 5 }),
            (newValue, existingValues) => {
              const uniqueExisting = [...new Set(existingValues)];

              // Toggle value in
              const afterAdd = toggleFilterValue(uniqueExisting, newValue, "checkbox");

              // If value wasn't present, it should now be present
              if (!uniqueExisting.includes(newValue)) {
                return afterAdd.includes(newValue);
              }
              // If value was present, it should now be absent
              return !afterAdd.includes(newValue);
            }
          ),
          { numRuns: 30 }
        );
      });
    });
  });
});
