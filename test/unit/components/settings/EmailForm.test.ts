import { describe, it, expect } from "vitest";
import { emailSchema, EmailForm } from "../../../../src/components/settings/EmailForm";

describe("EmailForm", () => {
  describe("emailSchema validation", () => {
    it("should accept valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.org",
        "user+tag@example.co.uk",
        "a@b.co",
      ];

      for (const email of validEmails) {
        const result = emailSchema.safeParse({ email });
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty email", () => {
      const result = emailSchema.safeParse({ email: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("emailRequired");
      }
    });

    it("should reject invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
      ];

      for (const email of invalidEmails) {
        const result = emailSchema.safeParse({ email });
        expect(result.success).toBe(false);
      }
    });

    it("should reject email without @ symbol", () => {
      const result = emailSchema.safeParse({ email: "invalidemail.com" });
      expect(result.success).toBe(false);
    });

    it("should reject email without domain extension", () => {
      const result = emailSchema.safeParse({ email: "test@domain" });
      expect(result.success).toBe(false);
    });
  });

  describe("EmailForm component", () => {
    it("should export EmailForm component", () => {
      expect(EmailForm).toBeDefined();
    });

    it("should be a function component", () => {
      expect(typeof EmailForm).toBe("function");
    });
  });
});
