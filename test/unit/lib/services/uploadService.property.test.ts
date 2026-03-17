import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/utils/uploadUtils", () => ({
  generateStoragePath: vi.fn(),
  getBucketName: vi.fn(),
  extractStoragePathFromUrl: vi.fn(),
}));

import { isAllowedMimeType, isValidFileSize } from "@/lib/services/uploadService";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

describe("Property-based tests — uploadService", () => {
  // Feature: supabase-storage-migration, Property 3: MIME type validation
  // **Validates: Requirements 3.3, 5.1, 10.4**
  it("P3 — isAllowedMimeType returns true iff the string is in the allowed list", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = isAllowedMimeType(s);
        const expected = ALLOWED_MIME_TYPES.includes(s);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: supabase-storage-migration, Property 4: File size validation
  // **Validates: Requirements 3.4, 10.5**
  it("P4 — isValidFileSize returns true iff 0 < n <= 5_242_880", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: 10_000_000 }), (n) => {
        const result = isValidFileSize(n);
        const expected = n > 0 && n <= 5_242_880;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});
