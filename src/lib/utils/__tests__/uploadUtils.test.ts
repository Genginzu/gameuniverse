import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  generateStoragePath,
  getBucketName,
  extractStoragePathFromUrl,
  getExtensionFromMimeType,
} from "@/lib/utils/uploadUtils";

describe("generateStoragePath", () => {
  it("generates a path matching the expected pattern", () => {
    const path = generateStoragePath("550e8400-e29b-41d4-a716-446655440000", "webp");
    expect(path).toMatch(/^550e8400-e29b-41d4-a716-446655440000\/\d+-[a-z0-9]+\.webp$/);
  });

  it("uses the correct userId and extension", () => {
    const path = generateStoragePath("user-456", "png");
    expect(path).toMatch(/^user-456\/\d+-[a-z0-9]+\.png$/);
  });

  it("generates unique paths for the same parameters", () => {
    const path1 = generateStoragePath("user-123", "jpg");
    const path2 = generateStoragePath("user-123", "jpg");
    expect(path1).not.toBe(path2);
  });

  it("includes a positive timestamp", () => {
    const path = generateStoragePath("user-123", "gif");
    const match = path.match(/^user-123\/(\d+)-[a-z0-9]+\.gif$/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(0);
  });
});

describe("getBucketName", () => {
  it('returns "avatars" for avatars context', () => {
    expect(getBucketName("avatars")).toBe("avatars");
  });

  it('returns "banners" for banners context', () => {
    expect(getBucketName("banners")).toBe("banners");
  });
});

describe("extractStoragePathFromUrl", () => {
  const SUPABASE_URL = "https://test-project.supabase.co";
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
    }
  });

  it("extracts bucket and path from a valid Supabase public URL", () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/user-123/1700000000-abc123.webp`;
    const result = extractStoragePathFromUrl(url);
    expect(result).toEqual({
      bucket: "avatars",
      path: "user-123/1700000000-abc123.webp",
    });
  });

  it("extracts from a banners URL", () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/banners/user-456/1700000000-def456.png`;
    const result = extractStoragePathFromUrl(url);
    expect(result).toEqual({
      bucket: "banners",
      path: "user-456/1700000000-def456.png",
    });
  });

  it("returns null for a completely unrelated URL", () => {
    expect(extractStoragePathFromUrl("https://example.com/image.png")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractStoragePathFromUrl("")).toBeNull();
  });

  it("returns null for an S3 URL", () => {
    const url =
      "https://gameuniverse-uploads.s3.eu-west-3.amazonaws.com/public/avatars/user-123/file.webp";
    expect(extractStoragePathFromUrl(url)).toBeNull();
  });

  it("returns null when NEXT_PUBLIC_SUPABASE_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/user-123/file.webp`;
    expect(extractStoragePathFromUrl(url)).toBeNull();
  });

  it("returns null when URL has bucket but no path", () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/avatars`;
    expect(extractStoragePathFromUrl(url)).toBeNull();
  });

  it("returns null when URL has bucket with trailing slash but no path", () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/`;
    expect(extractStoragePathFromUrl(url)).toBeNull();
  });
});

describe("getExtensionFromMimeType", () => {
  it("returns jpg for image/jpeg", () => {
    expect(getExtensionFromMimeType("image/jpeg")).toBe("jpg");
  });

  it("returns png for image/png", () => {
    expect(getExtensionFromMimeType("image/png")).toBe("png");
  });

  it("returns webp for image/webp", () => {
    expect(getExtensionFromMimeType("image/webp")).toBe("webp");
  });

  it("returns gif for image/gif", () => {
    expect(getExtensionFromMimeType("image/gif")).toBe("gif");
  });

  it("returns bin for unknown MIME types", () => {
    expect(getExtensionFromMimeType("application/pdf")).toBe("bin");
  });

  it("returns bin for empty string", () => {
    expect(getExtensionFromMimeType("")).toBe("bin");
  });
});

import fc from "fast-check";

describe("Property-based tests", () => {
  // Feature: supabase-storage-migration, Property 1: Storage path pattern
  // **Validates: Requirements 1.3, 1.4, 6.1**
  it("P1 — generateStoragePath always matches the expected pattern", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.constantFrom("jpg", "png", "webp", "gif"), (userId, ext) => {
        const path = generateStoragePath(userId, ext);
        const regex = new RegExp(`^${userId.replace(/-/g, "\\-")}/\\d+-[a-z0-9]+\\.${ext}$`);
        expect(path).toMatch(regex);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: supabase-storage-migration, Property 2: Bucket name resolution
  // **Validates: Requirements 2.2, 6.2**
  it("P2 — getBucketName returns the corresponding bucket name", () => {
    fc.assert(
      fc.property(fc.constantFrom("avatars" as const, "banners" as const), (context) => {
        const bucket = getBucketName(context);
        expect(bucket).toBe(context);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: supabase-storage-migration, Property 5: Round-trip public URL ↔ extraction
  // **Validates: Requirements 6.3, 6.4**
  describe("P5 — Round-trip public URL ↔ extraction", () => {
    const SUPABASE_URL = "https://test-project.supabase.co";
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    });

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
      }
    });

    it("round-trips valid bucket + path through URL construction and extraction", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("avatars", "banners"),
          fc.uuid(),
          fc.constantFrom("jpg", "png", "webp", "gif"),
          (bucket, userId, ext) => {
            const storagePath = generateStoragePath(userId, ext);
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
            const result = extractStoragePathFromUrl(publicUrl);
            expect(result).not.toBeNull();
            expect(result!.bucket).toBe(bucket);
            expect(result!.path).toBe(storagePath);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns null for non-Supabase URLs", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.startsWith(SUPABASE_URL)),
          (randomUrl) => {
            const result = extractStoragePathFromUrl(randomUrl);
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: supabase-storage-migration, Property 6: Path uniqueness
  // **Validates: Requirements 1.3, 1.4**
  it("P6 — two consecutive calls produce different paths", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.constantFrom("jpg", "png", "webp", "gif"), (userId, ext) => {
        const path1 = generateStoragePath(userId, ext);
        const path2 = generateStoragePath(userId, ext);
        expect(path1).not.toBe(path2);
      }),
      { numRuns: 100 }
    );
  });
});
