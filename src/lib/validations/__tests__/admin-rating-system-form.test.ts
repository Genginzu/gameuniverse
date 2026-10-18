import { describe, it, expect } from "vitest";
import {
  adminRatingSystemFormSchema,
  ratingSystemQuerySchema,
  type RatingSystemFormData,
} from "@/lib/validations/admin-rating-system-form";

describe("adminRatingSystemFormSchema", () => {
  describe("code field", () => {
    it("accepts a 10-character code (max length)", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "ABCDEFGHIJ",
        name: "Test",
      });
      expect(result.success).toBe(true);
    });

    it("rejects code with spaces", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PE GI",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code with hyphens", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PE-GI",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("name field", () => {
    it("accepts a valid name", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "Pan European Game Information",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a name of exactly 100 characters", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("country_codes field", () => {
    it("accepts an array of 2-letter country codes", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        country_codes: ["FR", "DE", "ES"],
      });
      expect(result.success).toBe(true);
    });

    it("defaults to empty array when not provided", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.country_codes).toEqual([]);
      }
    });

    it("rejects country codes that are not exactly 2 characters", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        country_codes: ["FRA"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("error messages", () => {
    it("returns descriptive error for empty code", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "",
        name: "Test",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const codeErrors = result.error.issues.filter((i) => i.path[0] === "code");
        expect(codeErrors.some((e) => e.message.includes("requis"))).toBe(true);
      }
    });

    it("returns descriptive error for invalid code pattern", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "pegi",
        name: "Test",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const codeErrors = result.error.issues.filter((i) => i.path[0] === "code");
        expect(codeErrors.some((e) => e.message.includes("majuscule"))).toBe(true);
      }
    });
  });

  describe("type inference", () => {
    it("produces correct RatingSystemFormData type", () => {
      const data: RatingSystemFormData = {
        code: "PEGI",
        name: "Pan European Game Information",
        description: "European rating system",
        country_codes: ["FR", "DE"],
        website_url: "https://pegi.info",
      };
      const result = adminRatingSystemFormSchema.parse(data);
      expect(result.code).toBe("PEGI");
      expect(result.name).toBe("Pan European Game Information");
    });
  });
});

describe("ratingSystemQuerySchema", () => {
  it("applies defaults", () => {
    expect(ratingSystemQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sort_by: "code",
    });
  });

  it.each([{ sort_by: "invalid" }, { limit: "101" }, { page: "0" }])("rejects %o", (input) => {
    expect(ratingSystemQuerySchema.safeParse(input).success).toBe(false);
  });
});
