import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { usernameSchema } from "../../../../src/components/settings/UsernameForm";

/**
 * Feature: settings-page
 * Property 1: Username validation rejects empty inputs
 * **Validates: Requirements 2.1**
 *
 * For any string input that is empty or contains only whitespace characters,
 * the username form SHALL reject the submission and not call the update API.
 *
 * This test validates the username validation schema to ensure it correctly
 * rejects empty and whitespace-only inputs.
 */

// Generator for empty strings (empty or whitespace-only)
const whitespaceChars = [" ", "\t", "\n", "\r"];
const emptyOrWhitespaceGenerator = fc.oneof(
  fc.constant(""),
  fc
    .array(fc.constantFrom(...whitespaceChars), { minLength: 1, maxLength: 50 })
    .map((arr) => arr.join(""))
);

// Generator for valid usernames (non-empty after trimming)
const validUsernameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

describe("Username Validation Property-Based Tests", () => {
  describe("Property 1: Username validation rejects empty inputs", () => {
    it("rejects empty string input", () => {
      const result = usernameSchema.safeParse({ username: "" });
      expect(result.success).toBe(false);
    });

    it("rejects all whitespace-only inputs", () => {
      fc.assert(
        fc.property(emptyOrWhitespaceGenerator, (whitespaceInput) => {
          const result = usernameSchema.safeParse({ username: whitespaceInput });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("accepts all non-empty usernames after trimming", () => {
      fc.assert(
        fc.property(validUsernameGenerator, (validUsername) => {
          const result = usernameSchema.safeParse({ username: validUsername });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.username).toBe(validUsername.trim());
          }
        }),
        { numRuns: 100 }
      );
    });

    it("trims whitespace from valid usernames", () => {
      const whitespaceGen = fc
        .array(fc.constantFrom(" ", "\t"), { minLength: 0, maxLength: 5 })
        .map((arr) => arr.join(""));

      fc.assert(
        fc.property(
          fc.tuple(
            whitespaceGen,
            fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            whitespaceGen
          ),
          ([leadingWhitespace, content, trailingWhitespace]) => {
            const inputWithWhitespace = leadingWhitespace + content + trailingWhitespace;
            const result = usernameSchema.safeParse({ username: inputWithWhitespace });
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.username).toBe(content.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
