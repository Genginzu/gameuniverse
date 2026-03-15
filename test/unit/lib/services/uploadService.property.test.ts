import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

import { generateS3Key, getExtensionFromMimeType } from "@/lib/utils/uploadUtils";
import {
  uploadRequestSchema,
  isAllowedMimeType,
  isAllowedContext,
  isValidFileSize,
} from "@/lib/validations/uploadValidation";
import {
  ALLOWED_CONTEXTS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  CONTEXT_TO_PROFILE_FIELD,
  type UploadContext,
} from "@/types/upload";

// --- Shared generators ---

const contextGen = fc.constantFrom<UploadContext>("avatars", "banners");
const uuidGen = fc.uuid();
const extensionGen = fc.constantFrom("jpg", "png", "webp", "gif");
const mimeTypeGen = fc.constantFrom(...ALLOWED_MIME_TYPES);

/**
 * Feature: player-avatar-upload, Property 1: S3 key pattern
 *
 * For any valid context, userId (UUID), and image extension,
 * the generated S3 key matches `public/{context}/{userId}/{timestamp}-{randomId}.{extension}`.
 *
 * **Validates: Requirements 1.2, 1.4, 1.5**
 */
describe("Property 1: S3 key pattern", () => {
  // Feature: player-avatar-upload, Property 1: S3 key pattern
  it("generates an S3 key matching the expected pattern", () => {
    fc.assert(
      fc.property(contextGen, uuidGen, extensionGen, (context, userId, extension) => {
        const key = generateS3Key(context, userId, extension);

        // Must start with public/{context}/{userId}/
        expect(key).toMatch(new RegExp(`^public/${context}/${userId}/`));

        // Full pattern: public/{context}/{userId}/{timestamp}-{randomId}.{extension}
        const pattern = new RegExp(
          `^public/${context}/${userId.replace(/-/g, "\\-")}/\\d+-[a-z0-9]+\\.${extension}$`
        );
        expect(key).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-avatar-upload, Property 2: MIME validation
 *
 * For any string, `isAllowedMimeType` returns true if and only if the string
 * is one of the four allowed types (image/jpeg, image/png, image/webp, image/gif).
 *
 * **Validates: Requirements 2.3, 3.1**
 */
describe("Property 2: MIME validation", () => {
  // Feature: player-avatar-upload, Property 2: MIME validation
  it("accepts only the four allowed MIME types", () => {
    fc.assert(
      fc.property(fc.string(), (mimeType) => {
        const result = isAllowedMimeType(mimeType);
        const expected = (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("always accepts known allowed MIME types", () => {
    fc.assert(
      fc.property(mimeTypeGen, (mimeType) => {
        expect(isAllowedMimeType(mimeType)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-avatar-upload, Property 3: File size validation
 *
 * For any positive integer, `isValidFileSize` accepts values in (0, 5_242_880]
 * and rejects values > 5_242_880 or <= 0.
 *
 * **Validates: Requirements 2.4, 3.2**
 */
describe("Property 3: File size validation", () => {
  // Feature: player-avatar-upload, Property 3: File size validation
  it("rejects files exceeding 5 MB", () => {
    const overSizeGen = fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: MAX_FILE_SIZE_BYTES * 10 });
    fc.assert(
      fc.property(overSizeGen, (size) => {
        expect(isValidFileSize(size)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("accepts files within the 5 MB limit", () => {
    const validSizeGen = fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES });
    fc.assert(
      fc.property(validSizeGen, (size) => {
        expect(isValidFileSize(size)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects zero and negative sizes", () => {
    const invalidSizeGen = fc.integer({ min: -1_000_000, max: 0 });
    fc.assert(
      fc.property(invalidSizeGen, (size) => {
        expect(isValidFileSize(size)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-avatar-upload, Property 4: Context validation
 *
 * For any string, `isAllowedContext` returns true if and only if the string
 * is "avatars" or "banners".
 *
 * **Validates: Requirements 2.5, 7.5**
 */
describe("Property 4: Context validation", () => {
  // Feature: player-avatar-upload, Property 4: Context validation
  it("accepts only avatars and banners", () => {
    fc.assert(
      fc.property(fc.string(), (context) => {
        const result = isAllowedContext(context);
        const expected = (ALLOWED_CONTEXTS as readonly string[]).includes(context);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("always accepts known valid contexts", () => {
    fc.assert(
      fc.property(contextGen, (context) => {
        expect(isAllowedContext(context)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-avatar-upload, Property 5: Context-to-field mapping
 *
 * For any valid context, the mapping returns the correct profile field:
 * "avatar_url" for "avatars" and "banner_url" for "banners".
 * The set of valid contexts exactly covers the mapping keys.
 *
 * **Validates: Requirements 2.6**
 */
describe("Property 5: Context-to-field mapping", () => {
  // Feature: player-avatar-upload, Property 5: Context-to-field mapping
  it("maps each context to the correct profile field", () => {
    fc.assert(
      fc.property(contextGen, (context) => {
        const field = CONTEXT_TO_PROFILE_FIELD[context];
        if (context === "avatars") {
          expect(field).toBe("avatar_url");
        } else {
          expect(field).toBe("banner_url");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("has mapping keys that exactly match ALLOWED_CONTEXTS", () => {
    const mappingKeys = Object.keys(CONTEXT_TO_PROFILE_FIELD).sort();
    const allowedContexts = [...ALLOWED_CONTEXTS].sort();
    expect(mappingKeys).toEqual(allowedContexts);
  });
});

/**
 * Feature: player-avatar-upload, Property 6: Unique file names
 *
 * For any pair of calls to `generateS3Key` with the same parameters,
 * the two generated keys must be different.
 *
 * **Validates: Requirements 7.2**
 */
describe("Property 6: Unique file names", () => {
  // Feature: player-avatar-upload, Property 6: Unique file names
  it("generates different keys for consecutive calls with identical params", () => {
    fc.assert(
      fc.property(contextGen, uuidGen, extensionGen, (context, userId, extension) => {
        const key1 = generateS3Key(context, userId, extension);
        const key2 = generateS3Key(context, userId, extension);
        expect(key1).not.toBe(key2);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-avatar-upload, Property 7: Schema round-trip
 *
 * For any valid UploadRequest (valid context, valid MIME type, valid file size),
 * serializing to JSON and parsing back through the Zod schema produces
 * an object equivalent to the original.
 *
 * **Validates: Requirements 2.3, 2.4, 2.5**
 */
describe("Property 7: Schema round-trip", () => {
  // Feature: player-avatar-upload, Property 7: Schema round-trip
  it("round-trips valid upload requests through JSON and Zod", () => {
    const validRequestGen = fc.record({
      context: contextGen,
      contentType: mimeTypeGen,
      fileSize: fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES }),
    });

    fc.assert(
      fc.property(validRequestGen, (request) => {
        const json = JSON.stringify(request);
        const parsed = uploadRequestSchema.parse(JSON.parse(json));
        expect(parsed).toEqual(request);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects requests with invalid MIME types", () => {
    const invalidMimeGen = fc
      .string()
      .filter((s) => !(ALLOWED_MIME_TYPES as readonly string[]).includes(s));

    fc.assert(
      fc.property(invalidMimeGen, contextGen, (badMime, context) => {
        const result = uploadRequestSchema.safeParse({
          context,
          contentType: badMime,
          fileSize: 1000,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects requests with oversized files", () => {
    const overSizeGen = fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: MAX_FILE_SIZE_BYTES * 10 });

    fc.assert(
      fc.property(overSizeGen, contextGen, mimeTypeGen, (size, context, mime) => {
        const result = uploadRequestSchema.safeParse({
          context,
          contentType: mime,
          fileSize: size,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Translation key parity helpers ---

import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

/**
 * Feature: player-avatar-upload, Property 8: Translation key parity
 *
 * For every translation key defined in the `upload` namespace of `fr.json`,
 * that same key must exist in `en.json`, and vice-versa.
 * The two files must have exactly the same set of keys for this namespace.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */
describe("Property 8: Translation key parity", () => {
  const frUploadKeys = Object.keys((frMessages as Record<string, Record<string, string>>).upload);
  const enUploadKeys = Object.keys((enMessages as Record<string, Record<string, string>>).upload);

  // Feature: player-avatar-upload, Property 8: Translation key parity
  it("every FR upload key exists in EN", () => {
    fc.assert(
      fc.property(fc.constantFrom(...frUploadKeys), (key) => {
        expect(enUploadKeys).toContain(key);
      }),
      { numRuns: 100 }
    );
  });

  it("every EN upload key exists in FR", () => {
    fc.assert(
      fc.property(fc.constantFrom(...enUploadKeys), (key) => {
        expect(frUploadKeys).toContain(key);
      }),
      { numRuns: 100 }
    );
  });

  it("FR and EN upload namespaces have identical key sets", () => {
    expect([...frUploadKeys].sort()).toEqual([...enUploadKeys].sort());
  });
});
