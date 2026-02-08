import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import {
  hasActiveFilters,
  countActiveFilters,
  toggleFilterValue,
  type FilterConfig,
  type FilterOption,
} from "../../../../src/components/shared/FilterPanel";

// Feature: code-refactoring, Property 7: FilterPanel State Consistency
// **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

// Generator for filter option IDs
const filterOptionIdGenerator = fc.stringMatching(/^[a-z0-9-]{1,20}$/);

// Generator for filter option
const filterOptionGenerator: fc.Arbitrary<FilterOption> = fc.record({
  id: filterOptionIdGenerator,
  label: fc.string({ minLength: 1, maxLength: 50 }),
  count: fc.option(fc.integer({ min: 0, max: 1000 })),
});

// Generator for filter config
const filterConfigGenerator: fc.Arbitrary<FilterConfig> = fc.record({
  id: filterOptionIdGenerator,
  label: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom("checkbox" as const, "radio" as const),
  options: fc.array(filterOptionGenerator, { minLength: 1, maxLength: 10 }),
  collapsible: fc.option(fc.boolean()),
  defaultExpanded: fc.option(fc.boolean()),
});

// Generator for active filters (filterId -> selected option ids)
const activeFiltersGenerator = fc.dictionary(
  filterOptionIdGenerator,
  fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 5 })
);

describe("FilterPanel Property-Based Tests", () => {
  describe("Property 7: FilterPanel State Consistency", () => {
    describe("hasActiveFilters helper", () => {
      it("returns false for empty activeFilters object", () => {
        expect(hasActiveFilters({})).toBe(false);
      });

      it("returns false when all filter arrays are empty", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 1, maxLength: 5 }),
            (filterIds) => {
              const activeFilters: Record<string, string[]> = {};
              filterIds.forEach((id) => {
                activeFilters[id] = [];
              });
              return hasActiveFilters(activeFilters) === false;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("returns true when at least one filter has values", () => {
        fc.assert(
          fc.property(
            filterOptionIdGenerator,
            fc.array(filterOptionIdGenerator, { minLength: 1, maxLength: 5 }),
            (filterId, values) => {
              const activeFilters: Record<string, string[]> = {
                [filterId]: values,
              };
              return hasActiveFilters(activeFilters) === true;
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe("countActiveFilters helper", () => {
      it("returns 0 for empty activeFilters object", () => {
        expect(countActiveFilters({})).toBe(0);
      });

      it("returns correct count for single filter", () => {
        fc.assert(
          fc.property(
            filterOptionIdGenerator,
            fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 }),
            (filterId, values) => {
              const activeFilters: Record<string, string[]> = {
                [filterId]: values,
              };
              return countActiveFilters(activeFilters) === values.length;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("returns sum of all filter values", () => {
        fc.assert(
          fc.property(activeFiltersGenerator, (activeFilters) => {
            const expectedCount = Object.values(activeFilters).reduce(
              (sum, values) => sum + values.length,
              0
            );
            return countActiveFilters(activeFilters) === expectedCount;
          }),
          { numRuns: 50 }
        );
      });
    });

    describe("toggleFilterValue helper", () => {
      it("checkbox: adds value when not present", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 }),
            filterOptionIdGenerator,
            (currentValues, newValue) => {
              // Ensure newValue is not in currentValues
              const filteredValues = currentValues.filter((v) => v !== newValue);
              const result = toggleFilterValue(filteredValues, newValue, "checkbox");
              return result.includes(newValue);
            }
          ),
          { numRuns: 50 }
        );
      });

      it("checkbox: removes value when present", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 1, maxLength: 10 }),
            (values) => {
              // Pick a value that's in the array
              const valueToRemove = values[0];
              const result = toggleFilterValue(values, valueToRemove, "checkbox");
              return !result.includes(valueToRemove);
            }
          ),
          { numRuns: 50 }
        );
      });

      it("checkbox: preserves other values when toggling", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 2, maxLength: 10 }),
            (values) => {
              // Ensure unique values
              const uniqueValues = [...new Set(values)];
              if (uniqueValues.length < 2) return true;

              const valueToToggle = uniqueValues[0];
              const otherValues = uniqueValues.slice(1);
              const result = toggleFilterValue(uniqueValues, valueToToggle, "checkbox");

              // All other values should still be present
              return otherValues.every((v) => result.includes(v));
            }
          ),
          { numRuns: 50 }
        );
      });

      it("radio: always returns single value array", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 0, maxLength: 10 }),
            filterOptionIdGenerator,
            (currentValues, newValue) => {
              const result = toggleFilterValue(currentValues, newValue, "radio");
              return result.length === 1 && result[0] === newValue;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("radio: replaces existing selection", () => {
        fc.assert(
          fc.property(
            fc.array(filterOptionIdGenerator, { minLength: 1, maxLength: 5 }),
            filterOptionIdGenerator,
            (currentValues, newValue) => {
              const result = toggleFilterValue(currentValues, newValue, "radio");
              // Should only contain the new value
              return result.length === 1 && result[0] === newValue;
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe("FilterPanel behavior simulation", () => {
      /**
       * Simulates the FilterPanel's rendering logic.
       */
      const simulateFilterPanelRender = (
        filters: FilterConfig[],
        activeFilters: Record<string, string[]>,
        showPanel: boolean
      ): {
        shouldRender: boolean;
        showClearButton: boolean;
        showActiveFilters: boolean;
        showFilterSections: boolean;
        activeFilterCount: number;
      } => {
        const activeFilterCount = countActiveFilters(activeFilters);
        const hasFilters = activeFilterCount > 0;

        return {
          shouldRender: hasFilters || showPanel,
          showClearButton: hasFilters,
          showActiveFilters: hasFilters,
          showFilterSections: showPanel,
          activeFilterCount,
        };
      };

      it("renders when showPanel is true regardless of active filters", () => {
        fc.assert(
          fc.property(
            fc.array(filterConfigGenerator, { minLength: 1, maxLength: 3 }),
            activeFiltersGenerator,
            (filters, activeFilters) => {
              const result = simulateFilterPanelRender(filters, activeFilters, true);
              return result.shouldRender === true && result.showFilterSections === true;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("renders when has active filters regardless of showPanel", () => {
        fc.assert(
          fc.property(
            fc.array(filterConfigGenerator, { minLength: 1, maxLength: 3 }),
            filterOptionIdGenerator,
            fc.array(filterOptionIdGenerator, { minLength: 1, maxLength: 5 }),
            fc.boolean(),
            (filters, filterId, values, showPanel) => {
              const activeFilters = { [filterId]: values };
              const result = simulateFilterPanelRender(filters, activeFilters, showPanel);
              return result.shouldRender === true && result.showActiveFilters === true;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("does not render when no active filters and showPanel is false", () => {
        fc.assert(
          fc.property(
            fc.array(filterConfigGenerator, { minLength: 1, maxLength: 3 }),
            (filters) => {
              const result = simulateFilterPanelRender(filters, {}, false);
              return result.shouldRender === false;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("clear button visibility matches hasActiveFilters", () => {
        fc.assert(
          fc.property(
            fc.array(filterConfigGenerator, { minLength: 1, maxLength: 3 }),
            activeFiltersGenerator,
            fc.boolean(),
            (filters, activeFilters, showPanel) => {
              const result = simulateFilterPanelRender(filters, activeFilters, showPanel);
              const hasFilters = hasActiveFilters(activeFilters);
              return result.showClearButton === hasFilters;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("active filter count is accurate", () => {
        fc.assert(
          fc.property(
            fc.array(filterConfigGenerator, { minLength: 1, maxLength: 3 }),
            activeFiltersGenerator,
            fc.boolean(),
            (filters, activeFilters, showPanel) => {
              const result = simulateFilterPanelRender(filters, activeFilters, showPanel);
              const expectedCount = countActiveFilters(activeFilters);
              return result.activeFilterCount === expectedCount;
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});
