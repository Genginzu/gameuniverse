import { describe, it, expect } from "vitest";
import {
  adminPlatformFormSchema,
  platformQuerySchema,
} from "@/lib/validations/admin-platform-form";

/**
 * Unit tests for admin-platform-form Zod validation schemas.
 * Requirements: 7.2, 7.5
 */

describe("adminPlatformFormSchema", () => {
  it("rejects missing slug", () => {
    const result = adminPlatformFormSchema.safeParse({
      translations: [{ language_code: "en", name: "PlayStation 5" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "",
      translations: [{ language_code: "en", name: "PlayStation 5" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with uppercase letters", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "PlayStation5",
      translations: [{ language_code: "en", name: "PlayStation 5" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug starting with hyphen", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "-ps5",
      translations: [{ language_code: "en", name: "PlayStation 5" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects payload with no translations", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      translations: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects payload with only empty-name translations", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      translations: [
        { language_code: "fr", name: "" },
        { language_code: "en", name: "" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid slug with EN translation", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "playstation-5",
      translations: [{ language_code: "en", name: "PlayStation 5" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid slug with FR translation only", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      translations: [{ language_code: "fr", name: "PlayStation 5" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional abbreviation", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      translations: [{ language_code: "en", name: "PlayStation 5", abbreviation: "PS5" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.translations[0].abbreviation).toBe("PS5");
    }
  });

  it("accepts empty string abbreviation", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      translations: [{ language_code: "en", name: "PlayStation 5", abbreviation: "" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional iconUrl", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      iconUrl: "https://example.com/ps5.png",
      translations: [{ language_code: "en", name: "PlayStation 5" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("platformQuerySchema", () => {
  it("applies defaults for empty input", () => {
    const result = platformQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort_by).toBe("slug");
      expect(result.data.sort_order).toBe("asc");
      expect(result.data.locale).toBe("fr");
    }
  });

  it("coerces string page/limit to numbers", () => {
    const result = platformQuerySchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects limit > 100", () => {
    const result = platformQuerySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });
});
