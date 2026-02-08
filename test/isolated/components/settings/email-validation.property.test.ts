import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { emailSchema } from "../../../../src/components/settings/EmailForm";

/**
 * Feature: settings-page
 * Property 3: Email validation rejects invalid formats
 * **Validates: Requirements 3.1**
 *
 * For any string input that does not match a valid email format
 * (missing @, invalid domain, etc.), the email form SHALL reject
 * the submission and not call the update API.
 */

// Generator for invalid emails - missing @ symbol
const missingAtGenerator = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => !s.includes("@") && s.trim().length > 0);

// Generator for invalid emails - missing domain after @
const missingDomainGenerator = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !s.includes("@"))
  .map((local) => `${local}@`);

// Generator for invalid emails - missing local part before @
const missingLocalPartGenerator = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !s.includes("@") && s.includes("."))
  .map((domain) => `@${domain}`);

// Generator for invalid emails - domain without TLD (no dot after @)
const noDotInDomainGenerator = fc
  .tuple(fc.stringMatching(/^[a-z][a-z0-9]{0,15}$/), fc.stringMatching(/^[a-z][a-z0-9]{0,15}$/))
  .map(([local, domain]) => `${local}@${domain}`);

// Generator for invalid emails - multiple @ symbols
const multipleAtGenerator = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,10}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,10}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,10}\.[a-z]{2,4}$/)
  )
  .map(([part1, part2, domain]) => `${part1}@${part2}@${domain}`);

// Generator for invalid emails - whitespace only
const whitespaceOnlyGenerator = fc
  .array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 20 })
  .map((arr) => arr.join(""));

describe("Email Validation Property-Based Tests", () => {
  describe("Property 3: Email validation rejects invalid formats", () => {
    it("rejects empty string input", () => {
      const result = emailSchema.safeParse({ email: "" });
      expect(result.success).toBe(false);
    });

    it("rejects whitespace-only inputs", () => {
      fc.assert(
        fc.property(whitespaceOnlyGenerator, (whitespace) => {
          const result = emailSchema.safeParse({ email: whitespace });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects strings without @ symbol", () => {
      fc.assert(
        fc.property(missingAtGenerator, (invalidEmail) => {
          const result = emailSchema.safeParse({ email: invalidEmail });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects emails with missing domain after @", () => {
      fc.assert(
        fc.property(missingDomainGenerator, (invalidEmail) => {
          const result = emailSchema.safeParse({ email: invalidEmail });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects emails with missing local part before @", () => {
      fc.assert(
        fc.property(missingLocalPartGenerator, (invalidEmail) => {
          const result = emailSchema.safeParse({ email: invalidEmail });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects emails without dot in domain (no TLD)", () => {
      fc.assert(
        fc.property(noDotInDomainGenerator, (invalidEmail) => {
          const result = emailSchema.safeParse({ email: invalidEmail });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects emails with multiple @ symbols", () => {
      fc.assert(
        fc.property(multipleAtGenerator, (invalidEmail) => {
          const result = emailSchema.safeParse({ email: invalidEmail });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    // Sanity check: verify known valid emails are accepted
    it("accepts known valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "test.user@domain.org",
        "name123@company.io",
        "a@b.co",
      ];

      for (const email of validEmails) {
        const result = emailSchema.safeParse({ email });
        expect(result.success).toBe(true);
      }
    });
  });
});
