import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createCollectionSchema,
  addCollectionItemSchema,
} from "../../../../src/lib/validations/collection";

/**
 * Feature: game-collections, Property 2: Validation des entrées
 *
 * _Pour toute_ chaîne de caractères, la validation de création de collection doit
 * rejeter : les noms vides ou composés uniquement d'espaces, les noms de plus de
 * 100 caractères, les descriptions de plus de 500 caractères, et les notes
 * d'éléments de plus de 250 caractères. Elle doit accepter toutes les entrées
 * conformes à ces contraintes.
 *
 * **Validates: Requirements 1.2, 1.5, 2.5**
 */

// --- Generators ---

/** Valid collection name: 1-100 chars, not whitespace-only */
const validNameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** Valid description: up to 500 chars */
const validDescriptionGenerator = fc.oneof(
  fc.constant(undefined),
  fc.string({ minLength: 0, maxLength: 500 })
);

/** Valid item note: up to 250 chars */
const validNoteGenerator = fc.oneof(
  fc.constant(undefined),
  fc.string({ minLength: 0, maxLength: 250 })
);

/** Valid UUID for gameId */
const validUuidGenerator = fc.uuid();

/** Name that is empty */
const emptyNameGenerator = fc.constant("");

/** Name composed only of whitespace */
const whitespaceOnlyNameGenerator = fc
  .array(fc.constantFrom(" ", "\t", "\n", "\r", " \t", "  "), { minLength: 1, maxLength: 20 })
  .map((parts) => parts.join(""));

/** Name exceeding 100 characters */
const tooLongNameGenerator = fc
  .string({ minLength: 101, maxLength: 300 })
  .filter((s) => s.length > 100);

/** Description exceeding 500 characters */
const tooLongDescriptionGenerator = fc
  .string({ minLength: 501, maxLength: 700 })
  .filter((s) => s.length > 501);

/** Note exceeding 250 characters */
const tooLongNoteGenerator = fc
  .string({ minLength: 251, maxLength: 400 })
  .filter((s) => s.length > 251);

// --- Tests ---

describe("Collection Validation - Property-Based Tests", () => {
  describe("Property 2: Validation des entrées", () => {
    // Feature: game-collections, Property 2: Validation des entrées

    describe("createCollectionSchema - valid inputs", () => {
      it("accepts all valid collection creation inputs", () => {
        fc.assert(
          fc.property(
            validNameGenerator,
            validDescriptionGenerator,
            fc.oneof(fc.constant(undefined), fc.boolean()),
            (name, description, isPublic) => {
              const input: Record<string, unknown> = { name };
              if (description !== undefined) input.description = description;
              if (isPublic !== undefined) input.isPublic = isPublic;

              const result = createCollectionSchema.safeParse(input);
              expect(result.success).toBe(true);
            }
          ),
          { numRuns: 200 }
        );
      });
    });

    describe("createCollectionSchema - name rejection", () => {
      it("rejects empty names", () => {
        fc.assert(
          fc.property(emptyNameGenerator, (name) => {
            const result = createCollectionSchema.safeParse({ name });
            expect(result.success).toBe(false);
          }),
          { numRuns: 30 }
        );
      });

      it("rejects whitespace-only names", () => {
        fc.assert(
          fc.property(whitespaceOnlyNameGenerator, (name) => {
            const result = createCollectionSchema.safeParse({ name });
            expect(result.success).toBe(false);
          }),
          { numRuns: 30 }
        );
      });

      it("rejects names exceeding 100 characters", () => {
        fc.assert(
          fc.property(tooLongNameGenerator, (name) => {
            const result = createCollectionSchema.safeParse({ name });
            expect(result.success).toBe(false);
            if (!result.success) {
              const nameErrors = result.error.issues.filter((i) => i.path.includes("name"));
              expect(nameErrors.length).toBeGreaterThan(0);
            }
          }),
          { numRuns: 30 }
        );
      });
    });

    describe("createCollectionSchema - description rejection", () => {
      it("rejects descriptions exceeding 500 characters", () => {
        fc.assert(
          fc.property(validNameGenerator, tooLongDescriptionGenerator, (name, description) => {
            const result = createCollectionSchema.safeParse({ name, description });
            expect(result.success).toBe(false);
            if (!result.success) {
              const descErrors = result.error.issues.filter((i) => i.path.includes("description"));
              expect(descErrors.length).toBeGreaterThan(0);
            }
          }),
          { numRuns: 30 }
        );
      });
    });

    describe("addCollectionItemSchema - note validation", () => {
      it("accepts valid notes within 250 characters", () => {
        fc.assert(
          fc.property(validUuidGenerator, validNoteGenerator, (gameId, note) => {
            const input: Record<string, unknown> = { gameId };
            if (note !== undefined) input.note = note;

            const result = addCollectionItemSchema.safeParse(input);
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects notes exceeding 250 characters", () => {
        fc.assert(
          fc.property(validUuidGenerator, tooLongNoteGenerator, (gameId, note) => {
            const result = addCollectionItemSchema.safeParse({ gameId, note });
            expect(result.success).toBe(false);
            if (!result.success) {
              const noteErrors = result.error.issues.filter((i) => i.path.includes("note"));
              expect(noteErrors.length).toBeGreaterThan(0);
            }
          }),
          { numRuns: 30 }
        );
      });
    });

    describe("Error messages", () => {
      it("provides descriptive error messages for all invalid inputs", () => {
        fc.assert(
          fc.property(
            fc.oneof(
              // Invalid name (empty)
              fc.constant({ name: "", description: undefined, note: undefined }),
              // Invalid name (too long)
              tooLongNameGenerator.map((name) => ({
                name,
                description: undefined,
                note: undefined,
              })),
              // Invalid description (too long)
              fc
                .tuple(validNameGenerator, tooLongDescriptionGenerator)
                .map(([name, description]) => ({ name, description, note: undefined }))
            ),
            ({ name, description }) => {
              const input: Record<string, unknown> = { name };
              if (description !== undefined) input.description = description;

              const result = createCollectionSchema.safeParse(input);
              expect(result.success).toBe(false);
              if (!result.success) {
                for (const issue of result.error.issues) {
                  expect(typeof issue.message).toBe("string");
                  expect(issue.message.length).toBeGreaterThan(0);
                }
              }
            }
          ),
          { numRuns: 30 }
        );
      });
    });
  });
});
