import { describe, it, expect } from "vitest";
import {
  adminDescriptorFormSchema,
  descriptorTranslationSchema,
  type DescriptorFormData,
} from "../../../../src/lib/validations/admin-descriptor-form";

describe("descriptorTranslationSchema", () => {
  it("accepts a valid translation", () => {
    const result = descriptorTranslationSchema.safeParse({
      language_code: "en",
      name: "Violence",
      description: "Contains violent content",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty language_code", () => {
    const result = descriptorTranslationSchema.safeParse({
      language_code: "",
      name: "Violence",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = descriptorTranslationSchema.safeParse({
      language_code: "en",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    const result = descriptorTranslationSchema.safeParse({
      language_code: "en",
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string description", () => {
    const result = descriptorTranslationSchema.safeParse({
      language_code: "en",
      name: "Violence",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined description", () => {
    const result = descriptorTranslationSchema.safeParse({
      language_code: "en",
      name: "Violence",
    });
    expect(result.success).toBe(true);
  });

  it("rejects description longer than 500 characters", () => {
    const result = descriptorTranslationSchema.safeParse({
      language_code: "en",
      name: "Violence",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("adminDescriptorFormSchema", () => {
  const validTranslation = {
    language_code: "en",
    name: "Violence",
    description: "Contains violent content",
  };

  describe("code field", () => {
    it("accepts a valid code", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        translations: [validTranslation],
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty code", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "",
        translations: [validTranslation],
      });
      expect(result.success).toBe(false);
    });

    it("rejects a code longer than 30 characters", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "a".repeat(31),
        translations: [validTranslation],
      });
      expect(result.success).toBe(false);
    });

    it("accepts a 30-character code (max length)", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "a".repeat(30),
        translations: [validTranslation],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("icon_url field", () => {
    it("accepts a valid URL", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        icon_url: "https://example.com/icon.png",
        translations: [validTranslation],
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        icon_url: "",
        translations: [validTranslation],
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        translations: [validTranslation],
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        icon_url: "not-a-url",
        translations: [validTranslation],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("translations field", () => {
    it("accepts an array with one translation", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        translations: [validTranslation],
      });
      expect(result.success).toBe(true);
    });

    it("accepts multiple translations", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        translations: [
          validTranslation,
          { language_code: "fr", name: "Violence", description: "Contenu violent" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty translations array", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        translations: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects when translations is missing", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
      });
      expect(result.success).toBe(false);
    });

    it("rejects translations with invalid entries", () => {
      const result = adminDescriptorFormSchema.safeParse({
        code: "VIOLENCE",
        translations: [{ language_code: "", name: "" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("produces correct DescriptorFormData type", () => {
      const data: DescriptorFormData = {
        code: "VIOLENCE",
        icon_url: "https://example.com/icon.png",
        translations: [{ language_code: "en", name: "Violence", description: "Violent content" }],
      };
      const result = adminDescriptorFormSchema.parse(data);
      expect(result.code).toBe("VIOLENCE");
      expect(result.translations).toHaveLength(1);
    });
  });
});
