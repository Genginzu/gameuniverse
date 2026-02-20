import { describe, it, expect } from "vitest";
import {
  hasActiveFilters,
  countActiveFilters,
  toggleFilterValue,
} from "../../../../src/components/shared/FilterPanel";

describe("FilterPanel Helper Functions", () => {
  describe("hasActiveFilters", () => {
    describe("empty states", () => {
      it("returns false for empty object", () => {
        expect(hasActiveFilters({})).toBe(false);
      });

      it("returns false when all arrays are empty", () => {
        expect(hasActiveFilters({ genres: [], platforms: [] })).toBe(false);
      });

      it("returns false for single empty array", () => {
        expect(hasActiveFilters({ genres: [] })).toBe(false);
      });
    });

    describe("active states", () => {
      it("returns true for single filter with one value", () => {
        expect(hasActiveFilters({ genres: ["action"] })).toBe(true);
      });

      it("returns true for single filter with multiple values", () => {
        expect(hasActiveFilters({ genres: ["action", "rpg"] })).toBe(true);
      });

      it("returns true for multiple filters with values", () => {
        expect(
          hasActiveFilters({
            genres: ["action"],
            platforms: ["pc", "ps5"],
          })
        ).toBe(true);
      });

      it("returns true when only one filter has values", () => {
        expect(
          hasActiveFilters({
            genres: [],
            platforms: ["pc"],
          })
        ).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("handles many empty filters", () => {
        expect(
          hasActiveFilters({
            a: [],
            b: [],
            c: [],
            d: [],
            e: [],
          })
        ).toBe(false);
      });

      it("handles filter with empty string value", () => {
        expect(hasActiveFilters({ genres: [""] })).toBe(true);
      });
    });
  });

  describe("countActiveFilters", () => {
    describe("empty states", () => {
      it("returns 0 for empty object", () => {
        expect(countActiveFilters({})).toBe(0);
      });

      it("returns 0 when all arrays are empty", () => {
        expect(countActiveFilters({ genres: [], platforms: [] })).toBe(0);
      });
    });

    describe("counting", () => {
      it("counts single filter value", () => {
        expect(countActiveFilters({ genres: ["action"] })).toBe(1);
      });

      it("counts multiple values in single filter", () => {
        expect(countActiveFilters({ genres: ["action", "rpg", "adventure"] })).toBe(3);
      });

      it("sums values across multiple filters", () => {
        expect(
          countActiveFilters({
            genres: ["action", "rpg"],
            platforms: ["pc"],
          })
        ).toBe(3);
      });

      it("handles mix of empty and non-empty filters", () => {
        expect(
          countActiveFilters({
            genres: ["action"],
            platforms: [],
            ratings: ["mature", "teen"],
          })
        ).toBe(3);
      });
    });

    describe("edge cases", () => {
      it("handles large number of filters", () => {
        const filters: Record<string, string[]> = {};
        for (let i = 0; i < 100; i++) {
          filters[`filter${i}`] = [`value${i}`];
        }
        expect(countActiveFilters(filters)).toBe(100);
      });

      it("handles filter with many values", () => {
        const values = Array.from({ length: 50 }, (_, i) => `value${i}`);
        expect(countActiveFilters({ genres: values })).toBe(50);
      });
    });
  });

  describe("toggleFilterValue", () => {
    describe("checkbox mode", () => {
      it("adds value to empty array", () => {
        const result = toggleFilterValue([], "action", "checkbox");
        expect(result).toEqual(["action"]);
      });

      it("adds value to existing array", () => {
        const result = toggleFilterValue(["rpg"], "action", "checkbox");
        expect(result).toContain("rpg");
        expect(result).toContain("action");
        expect(result.length).toBe(2);
      });

      it("removes value when already present", () => {
        const result = toggleFilterValue(["action", "rpg"], "action", "checkbox");
        expect(result).not.toContain("action");
        expect(result).toContain("rpg");
        expect(result.length).toBe(1);
      });

      it("preserves order of other values when removing", () => {
        const result = toggleFilterValue(["a", "b", "c", "d"], "b", "checkbox");
        expect(result).toEqual(["a", "c", "d"]);
      });

      it("adds to end when adding new value", () => {
        const result = toggleFilterValue(["a", "b"], "c", "checkbox");
        expect(result[result.length - 1]).toBe("c");
      });

      it("handles removing last value", () => {
        const result = toggleFilterValue(["action"], "action", "checkbox");
        expect(result).toEqual([]);
      });

      it("handles duplicate values in input (removes first occurrence)", () => {
        const result = toggleFilterValue(["action", "rpg", "action"], "action", "checkbox");
        // filter removes all occurrences
        expect(result).toEqual(["rpg"]);
      });
    });

    describe("radio mode", () => {
      it("returns single value array for empty input", () => {
        const result = toggleFilterValue([], "action", "radio");
        expect(result).toEqual(["action"]);
      });

      it("replaces existing single value", () => {
        const result = toggleFilterValue(["rpg"], "action", "radio");
        expect(result).toEqual(["action"]);
      });

      it("replaces multiple existing values", () => {
        const result = toggleFilterValue(["rpg", "action", "adventure"], "shooter", "radio");
        expect(result).toEqual(["shooter"]);
      });

      it("returns same value when selecting already selected", () => {
        const result = toggleFilterValue(["action"], "action", "radio");
        expect(result).toEqual(["action"]);
      });
    });

    describe("edge cases", () => {
      it("handles empty string value in checkbox mode", () => {
        const result = toggleFilterValue(["action"], "", "checkbox");
        expect(result).toContain("action");
        expect(result).toContain("");
      });

      it("handles empty string value in radio mode", () => {
        const result = toggleFilterValue(["action"], "", "radio");
        expect(result).toEqual([""]);
      });

      it("handles special characters in values", () => {
        const result = toggleFilterValue([], "action-rpg", "checkbox");
        expect(result).toEqual(["action-rpg"]);
      });

      it("handles unicode values", () => {
        const result = toggleFilterValue([], "アクション", "checkbox");
        expect(result).toEqual(["アクション"]);
      });

      it("does not mutate original array in checkbox mode", () => {
        const original = ["action", "rpg"];
        const result = toggleFilterValue(original, "adventure", "checkbox");
        expect(original).toEqual(["action", "rpg"]);
        expect(result).not.toBe(original);
      });

      it("does not mutate original array in radio mode", () => {
        const original = ["action"];
        const result = toggleFilterValue(original, "rpg", "radio");
        expect(original).toEqual(["action"]);
        expect(result).not.toBe(original);
      });
    });
  });
});
