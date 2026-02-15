import { describe, it, expect } from "bun:test";
import {
  adminRatingFormSchema,
  type RatingFormData,
} from "../../../../src/lib/validations/admin-rating-form";

describe("adminRatingFormSchema", () => {
  describe("code field", () => {
    it("accepts a valid code", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty code", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "",
        display_name: "Everyone",
        minimum_age: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a code longer than 10 characters", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "ABCDEFGHIJK",
        display_name: "Test",
        minimum_age: 0,
      });
      expect(result.success).toBe(false);
    });

    it("accepts a 10-character code (max length)", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "ABCDEFGHIJ",
        display_name: "Test",
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("display_name field", () => {
    it("accepts a valid display name", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty display name", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "",
        minimum_age: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a display name longer than 50 characters", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "a".repeat(51),
        minimum_age: 0,
      });
      expect(result.success).toBe(false);
    });

    it("accepts a display name of exactly 50 characters", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "a".repeat(50),
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("minimum_age field", () => {
    it("accepts age 0", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts a positive age", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "T",
        display_name: "Teen",
        minimum_age: 13,
      });
      expect(result.success).toBe(true);
    });

    it("rejects a negative age", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: -1,
      });
      expect(result.success).toBe(false);
    });

    it("coerces string to number", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "T",
        display_name: "Teen",
        minimum_age: "13",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minimum_age).toBe(13);
      }
    });

    it("rejects non-integer age", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 3.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("color_hex field", () => {
    it("accepts a valid hex color", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        color_hex: "#00FF00",
      });
      expect(result.success).toBe(true);
    });

    it("accepts lowercase hex color", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        color_hex: "#ff00aa",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        color_hex: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid hex color (no hash)", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        color_hex: "FF0000",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid hex color (3-digit shorthand)", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        color_hex: "#F00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid hex color (invalid characters)", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        color_hex: "#GGGGGG",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("icon_url field", () => {
    it("accepts a valid URL", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        icon_url: "https://example.com/icon.png",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        icon_url: "",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        icon_url: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("translations field", () => {
    it("accepts valid translations", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        translations: [
          { language_code: "en", description: "Suitable for all ages" },
          { language_code: "fr", description: "Convient à tous les âges" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty translations array", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        translations: [],
      });
      expect(result.success).toBe(true);
    });

    it("defaults to empty array when not provided", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.translations).toEqual([]);
      }
    });

    it("rejects translation with empty language_code", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        translations: [{ language_code: "", description: "Test" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects translation with description exceeding 500 characters", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        translations: [{ language_code: "en", description: "a".repeat(501) }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("sort_order field", () => {
    it("defaults to 0 when not provided", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe(0);
      }
    });

    it("accepts a positive sort order", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        sort_order: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects a negative sort order", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        sort_order: -1,
      });
      expect(result.success).toBe(false);
    });

    it("coerces string to number", () => {
      const result = adminRatingFormSchema.safeParse({
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        sort_order: "3",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe(3);
      }
    });
  });

  describe("type inference", () => {
    it("produces correct RatingFormData type", () => {
      const data: RatingFormData = {
        code: "E",
        display_name: "Everyone",
        minimum_age: 0,
        color_hex: "#00FF00",
        icon_url: "https://example.com/icon.png",
        sort_order: 1,
        translations: [{ language_code: "en", description: "Suitable for all ages" }],
      };
      const result = adminRatingFormSchema.parse(data);
      expect(result.code).toBe("E");
      expect(result.minimum_age).toBe(0);
    });
  });
});
