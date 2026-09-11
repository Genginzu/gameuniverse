import { describe, it, expect } from "bun:test";
import {
  adminRatingSystemFormSchema,
  ratingSystemQuerySchema,
  type RatingSystemFormData,
} from "../../../../src/lib/validations/admin-rating-system-form";

describe("adminRatingSystemFormSchema", () => {
  describe("code field", () => {
    it("accepts a valid uppercase code", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "Pan European Game Information",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a code with digits and underscores", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "ESRB_V2",
        name: "ESRB Version 2",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a single uppercase letter code", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "P",
        name: "Test",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a 10-character code (max length)", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "ABCDEFGHIJ",
        name: "Test",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty code", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a code longer than 10 characters", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "ABCDEFGHIJK",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("rejects lowercase letters", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "pegi",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code starting with a digit", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "1PEGI",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code starting with an underscore", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "_PEGI",
        name: "Test",
      });
      expect(result.success).toBe(false);
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

    it("rejects an empty name", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a name longer than 100 characters", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts a name of exactly 100 characters", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("description field", () => {
    it("accepts a valid description", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        description: "European rating system",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string description", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        description: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined description", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
      });
      expect(result.success).toBe(true);
    });

    it("rejects description longer than 500 characters", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        description: "a".repeat(501),
      });
      expect(result.success).toBe(false);
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

  describe("website_url field", () => {
    it("accepts a valid URL", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        website_url: "https://pegi.info",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        website_url: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL", () => {
      const result = adminRatingSystemFormSchema.safeParse({
        code: "PEGI",
        name: "PEGI",
        website_url: "not-a-url",
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
