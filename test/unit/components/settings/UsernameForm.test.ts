import { describe, it, expect } from "vitest";
import { usernameSchema, UsernameForm } from "../../../../src/components/settings/UsernameForm";

describe("UsernameForm", () => {
  describe("usernameSchema validation", () => {
    it("should accept valid usernames", () => {
      const validUsernames = ["john", "JohnDoe", "user123", "test_user", "user-name", "a"];

      for (const username of validUsernames) {
        const result = usernameSchema.safeParse({ username });
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty username", () => {
      const result = usernameSchema.safeParse({ username: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("usernameRequired");
      }
    });

    it("should reject whitespace-only username", () => {
      const result = usernameSchema.safeParse({ username: "   " });
      expect(result.success).toBe(false);
    });

    it("should trim whitespace from username", () => {
      const result = usernameSchema.safeParse({ username: "  john  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe("john");
      }
    });

    it("should accept username with leading/trailing spaces after trim", () => {
      const result = usernameSchema.safeParse({ username: "  validuser  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe("validuser");
      }
    });
  });

  describe("UsernameForm component", () => {
    it("should export UsernameForm component", () => {
      expect(UsernameForm).toBeDefined();
    });

    it("should be a function component", () => {
      expect(typeof UsernameForm).toBe("function");
    });
  });
});
