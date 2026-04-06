import { describe, it, expect } from "vitest";
import { adminCommentQuerySchema } from "@/lib/validations/admin-comment-query";

describe("adminCommentQuerySchema", () => {
  it("passes with valid string-coerced values", () => {
    const result = adminCommentQuerySchema.parse({
      page: "1",
      limit: "20",
      sort_by: "created_at",
      sort_order: "desc",
    });
    expect(result).toEqual({
      page: 1,
      limit: 20,
      sort_by: "created_at",
      sort_order: "desc",
    });
  });

  it("applies defaults for empty input", () => {
    const result = adminCommentQuerySchema.parse({});
    expect(result).toEqual({
      page: 1,
      limit: 20,
      sort_by: "created_at",
      sort_order: "desc",
    });
  });

  it("rejects invalid sort_by", () => {
    expect(() =>
      adminCommentQuerySchema.parse({ sort_by: "invalid" })
    ).toThrow();
  });

  it("rejects page 0 (min 1)", () => {
    expect(() => adminCommentQuerySchema.parse({ page: "0" })).toThrow();
  });

  it("rejects limit 101 (max 100)", () => {
    expect(() => adminCommentQuerySchema.parse({ limit: "101" })).toThrow();
  });
});
