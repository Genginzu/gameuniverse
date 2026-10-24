import { describe, it, expect } from "vitest";
import { countActiveFilters } from "@/lib/utils/filter-utils";

describe("FilterPanel Helper Functions", () => {

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
});
