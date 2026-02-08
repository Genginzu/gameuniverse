import { describe, it, expect } from "bun:test";
import { getVisiblePages } from "../../../../src/components/shared/Pagination";

describe("getVisiblePages helper", () => {
  describe("basic pagination", () => {
    it("returns all pages when total is small", () => {
      const result = getVisiblePages(1, 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it("returns single page when totalPages is 1", () => {
      const result = getVisiblePages(1, 1);
      expect(result).toEqual([1]);
    });

    it("returns two pages when totalPages is 2", () => {
      const result = getVisiblePages(1, 2);
      expect(result).toEqual([1, 2]);
    });
  });

  describe("ellipsis handling", () => {
    it("adds ellipsis after first page when current is far from start", () => {
      const result = getVisiblePages(5, 10);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe("...");
    });

    it("adds ellipsis before last page when current is far from end", () => {
      const result = getVisiblePages(5, 10);
      expect(result[result.length - 2]).toBe("...");
      expect(result[result.length - 1]).toBe(10);
    });

    it("shows ellipsis when on first page with 5 pages", () => {
      const result = getVisiblePages(1, 5);
      // With delta=2, page 1 shows 1,2,3 and needs ellipsis before 5
      expect(result).toContain("...");
    });

    it("shows ellipsis only at end when on first page with large total", () => {
      const result = getVisiblePages(1, 10);
      expect(result[0]).toBe(1);
      // Should have ellipsis before last page
      const ellipsisCount = result.filter((p) => p === "...").length;
      expect(ellipsisCount).toBe(1);
    });

    it("shows ellipsis only at start when on last page with large total", () => {
      const result = getVisiblePages(10, 10);
      expect(result[result.length - 1]).toBe(10);
      // Should have ellipsis after first page
      const ellipsisCount = result.filter((p) => p === "...").length;
      expect(ellipsisCount).toBe(1);
    });

    it("shows both ellipses when in middle of large range", () => {
      const result = getVisiblePages(10, 20);
      const ellipsisCount = result.filter((p) => p === "...").length;
      expect(ellipsisCount).toBe(2);
    });
  });

  describe("delta range", () => {
    it("includes 2 pages before and after current page", () => {
      const result = getVisiblePages(10, 20);
      // Should include 8, 9, 10, 11, 12
      expect(result).toContain(8);
      expect(result).toContain(9);
      expect(result).toContain(10);
      expect(result).toContain(11);
      expect(result).toContain(12);
    });

    it("handles current page near start", () => {
      const result = getVisiblePages(2, 10);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).toContain(4);
    });

    it("handles current page near end", () => {
      const result = getVisiblePages(9, 10);
      expect(result).toContain(7);
      expect(result).toContain(8);
      expect(result).toContain(9);
      expect(result).toContain(10);
    });
  });

  describe("edge cases", () => {
    it("handles page 3 with no start ellipsis needed", () => {
      const result = getVisiblePages(3, 10);
      // Page 3 - delta 2 = 1, so no ellipsis needed at start
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(2);
    });

    it("handles page 8 of 10 with no end ellipsis needed", () => {
      const result = getVisiblePages(8, 10);
      // Page 8 + delta 2 = 10, so no ellipsis needed at end
      expect(result[result.length - 1]).toBe(10);
      expect(result[result.length - 2]).toBe(9);
    });

    it("handles very large page numbers", () => {
      const result = getVisiblePages(500, 1000);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe("...");
      expect(result).toContain(498);
      expect(result).toContain(499);
      expect(result).toContain(500);
      expect(result).toContain(501);
      expect(result).toContain(502);
      expect(result[result.length - 2]).toBe("...");
      expect(result[result.length - 1]).toBe(1000);
    });

    it("returns correct structure for page 4 of 10", () => {
      const result = getVisiblePages(4, 10);
      // start=2, end=6, so we need first page + ellipsis
      expect(result[0]).toBe(1);
      // Pages 2-6 should be included
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).toContain(4);
      expect(result).toContain(5);
      expect(result).toContain(6);
    });
  });

  describe("boundary conditions", () => {
    it("handles currentPage equal to totalPages", () => {
      const result = getVisiblePages(5, 5);
      // With delta=2, page 5 shows 3,4,5 and needs ellipsis after 1
      expect(result[0]).toBe(1);
      expect(result).toContain(3);
      expect(result).toContain(4);
      expect(result).toContain(5);
    });

    it("handles currentPage of 1", () => {
      const result = getVisiblePages(1, 100);
      expect(result[0]).toBe(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
    });

    it("handles totalPages of 4 (no ellipsis needed)", () => {
      const result = getVisiblePages(2, 4);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("handles totalPages of 5 (boundary case)", () => {
      const result = getVisiblePages(3, 5);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("handles totalPages of 6 with current at 3", () => {
      const result = getVisiblePages(3, 6);
      // start=1, end=5, so pages 1-5 plus page 6
      expect(result).toContain(1);
      expect(result).toContain(6);
    });
  });
});
