import { describe, it, expect } from "vitest";
import { adminGameFormSchema } from "@/lib/validations/admin-game-form";

const valid = {
  translations: [{ language_code: "fr", title: "Test Game" }],
  genres: [{ genre_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }],
};

describe("adminGameFormSchema", () => {
  it("accepts minimal valid data", () => {
    expect(adminGameFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty translations", () => {
    expect(adminGameFormSchema.safeParse({ ...valid, translations: [] }).success).toBe(false);
  });

  it("rejects translations without any title", () => {
    const result = adminGameFormSchema.safeParse({
      ...valid,
      translations: [{ language_code: "fr", title: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty genres", () => {
    expect(adminGameFormSchema.safeParse({ ...valid, genres: [] }).success).toBe(false);
  });

  it("accepts valid hex color for background_color", () => {
    const result = adminGameFormSchema.safeParse({ ...valid, background_color: "#AA00FF" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const result = adminGameFormSchema.safeParse({ ...valid, background_color: "red" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for optional URL fields", () => {
    const result = adminGameFormSchema.safeParse({
      ...valid,
      cover_image_url: "",
      background_image_url: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects metascore above 100", () => {
    expect(adminGameFormSchema.safeParse({ ...valid, metascore: 101 }).success).toBe(false);
  });

  it("accepts valid screenshot with url", () => {
    const result = adminGameFormSchema.safeParse({
      ...valid,
      screenshots: [{ url: "https://example.com/img.png" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects screenshot without url", () => {
    const result = adminGameFormSchema.safeParse({
      ...valid,
      screenshots: [{ alt_text: "no url" }],
    });
    expect(result.success).toBe(false);
  });

  it("coerces metascore from string to number", () => {
    const result = adminGameFormSchema.safeParse({ ...valid, metascore: "85" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metascore).toBe(85);
    }
  });

  it("accepts empty string for metascore", () => {
    const result = adminGameFormSchema.safeParse({ ...valid, metascore: "" });
    expect(result.success).toBe(true);
  });
});
