import { describe, it, expect } from "vitest";
import {
  adminLanguageFormSchema,
  type LanguageFormData,
} from "../../../../src/lib/validations/admin-language-form";

describe("adminLanguageFormSchema", () => {
  describe("code field", () => {
    it("accepts a valid 2-letter code", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "French",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a valid code with hyphens", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "pt-br",
        name: "Portuguese (Brazil)",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a 10-character code", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "abcdefghij",
        name: "Test Language",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a single character code", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "f",
        name: "French",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a code longer than 10 characters", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "abcdefghijk",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("rejects uppercase letters", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "FR",
        name: "French",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code starting with a hyphen", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "-fr",
        name: "French",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code ending with a hyphen", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr-",
        name: "French",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code with numbers", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr1",
        name: "French",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code with spaces", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "f r",
        name: "French",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty code", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "",
        name: "French",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("name field", () => {
    it("accepts a valid name", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "French",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty name", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a name longer than 100 characters", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts a name of exactly 100 characters", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("native_name field", () => {
    it("accepts a valid native name", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "French",
        native_name: "Français",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.native_name).toBe("Français");
      }
    });

    it("accepts an empty string for native_name", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "French",
        native_name: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined native_name", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "French",
      });
      expect(result.success).toBe(true);
    });

    it("rejects native_name longer than 100 characters", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "French",
        native_name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("error messages", () => {
    it("returns descriptive error for short code", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "f",
        name: "French",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const codeErrors = result.error.issues.filter((i) => i.path[0] === "code");
        expect(codeErrors.length).toBeGreaterThan(0);
      }
    });

    it("returns descriptive error for invalid code pattern", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "FR",
        name: "French",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const codeErrors = result.error.issues.filter((i) => i.path[0] === "code");
        expect(codeErrors.some((e) => e.message.includes("lettres minuscules"))).toBe(true);
      }
    });

    it("returns descriptive error for empty name", () => {
      const result = adminLanguageFormSchema.safeParse({
        code: "fr",
        name: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameErrors = result.error.issues.filter((i) => i.path[0] === "name");
        expect(nameErrors.some((e) => e.message.includes("requis"))).toBe(true);
      }
    });
  });

  describe("type inference", () => {
    it("produces correct LanguageFormData type", () => {
      const data: LanguageFormData = {
        code: "fr",
        name: "French",
        native_name: "Français",
      };
      const result = adminLanguageFormSchema.parse(data);
      expect(result.code).toBe("fr");
      expect(result.name).toBe("French");
      expect(result.native_name).toBe("Français");
    });
  });
});
