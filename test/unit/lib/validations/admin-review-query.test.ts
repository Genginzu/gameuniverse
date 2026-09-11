/**
 * Unit tests for adminReviewQuerySchema
 *
 * Tests default values, boundaries, and invalid parameters.
 * Requirements: 1.1
 */

import { describe, it, expect } from "bun:test";
import { adminReviewQuerySchema } from "../../../../src/lib/validations/admin-review-query";

describe("adminReviewQuerySchema", () => {
  describe("default values", () => {
    it("applies all defaults when no params provided", () => {
      const result = adminReviewQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.search).toBeUndefined();
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });
  });

  describe("page parameter", () => {
    it("accepts page = 1", () => {
      const result = adminReviewQuerySchema.safeParse({ page: 1 });
      expect(result.success).toBe(true);
    });

    it("coerces string to number", () => {
      const result = adminReviewQuerySchema.safeParse({ page: "3" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.page).toBe(3);
    });

    it("rejects page = 0", () => {
      expect(adminReviewQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    });

    it("rejects negative page", () => {
      expect(adminReviewQuerySchema.safeParse({ page: -1 }).success).toBe(false);
    });

    it("rejects non-integer page", () => {
      expect(adminReviewQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
    });
  });

  describe("limit parameter", () => {
    it("accepts limit = 1", () => {
      const result = adminReviewQuerySchema.safeParse({ limit: 1 });
      expect(result.success).toBe(true);
    });

    it("accepts limit = 100", () => {
      const result = adminReviewQuerySchema.safeParse({ limit: 100 });
      expect(result.success).toBe(true);
    });

    it("rejects limit = 0", () => {
      expect(adminReviewQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    });

    it("rejects limit = 101", () => {
      expect(adminReviewQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    it("coerces string to number", () => {
      const result = adminReviewQuerySchema.safeParse({ limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.limit).toBe(50);
    });
  });

  describe("search parameter", () => {
    it("accepts a search string", () => {
      const result = adminReviewQuerySchema.safeParse({ search: "zelda" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBe("zelda");
    });

    it("accepts empty search string", () => {
      const result = adminReviewQuerySchema.safeParse({ search: "" });
      expect(result.success).toBe(true);
    });

    it("is optional", () => {
      const result = adminReviewQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBeUndefined();
    });
  });

  describe("sort_by parameter", () => {
    const validSortFields = ["created_at", "updated_at", "rating", "player_name", "game_title"];

    for (const field of validSortFields) {
      it(`accepts sort_by = "${field}"`, () => {
        const result = adminReviewQuerySchema.safeParse({ sort_by: field });
        expect(result.success).toBe(true);
      });
    }

    it("rejects invalid sort_by value", () => {
      expect(adminReviewQuerySchema.safeParse({ sort_by: "invalid" }).success).toBe(false);
    });

    it("rejects empty sort_by", () => {
      expect(adminReviewQuerySchema.safeParse({ sort_by: "" }).success).toBe(false);
    });
  });

  describe("sort_order parameter", () => {
    it("accepts asc", () => {
      const result = adminReviewQuerySchema.safeParse({ sort_order: "asc" });
      expect(result.success).toBe(true);
    });

    it("accepts desc", () => {
      const result = adminReviewQuerySchema.safeParse({ sort_order: "desc" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid sort_order", () => {
      expect(adminReviewQuerySchema.safeParse({ sort_order: "random" }).success).toBe(false);
    });
  });

  describe("combined valid parameters", () => {
    it("accepts all valid params together", () => {
      const result = adminReviewQuerySchema.safeParse({
        page: "2",
        limit: "50",
        search: "mario",
        sort_by: "rating",
        sort_order: "asc",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.search).toBe("mario");
        expect(result.data.sort_by).toBe("rating");
        expect(result.data.sort_order).toBe("asc");
      }
    });
  });
});
