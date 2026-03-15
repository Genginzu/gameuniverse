import { describe, it, expect } from "vitest";

import {
  generateS3Key,
  extractS3KeyFromUrl,
  getExtensionFromMimeType,
} from "@/lib/utils/uploadUtils";

describe("generateS3Key", () => {
  it("generates a key matching the expected pattern", () => {
    const key = generateS3Key("avatars", "user-123", "webp");
    expect(key).toMatch(/^public\/avatars\/user-123\/\d+-[a-z0-9]+\.webp$/);
  });

  it("uses the correct context in the path", () => {
    const key = generateS3Key("banners", "user-456", "png");
    expect(key).toMatch(/^public\/banners\/user-456\/\d+-[a-z0-9]+\.png$/);
  });

  it("generates unique keys for the same parameters", () => {
    const key1 = generateS3Key("avatars", "user-123", "jpg");
    const key2 = generateS3Key("avatars", "user-123", "jpg");
    expect(key1).not.toBe(key2);
  });
});

describe("extractS3KeyFromUrl", () => {
  it("extracts the key from a valid public URL", () => {
    const url =
      "https://gameuniverse-uploads.s3.eu-west-3.amazonaws.com/public/avatars/user-123/1700000000-abc123.webp";
    const key = extractS3KeyFromUrl(url);
    expect(key).toBe("public/avatars/user-123/1700000000-abc123.webp");
  });

  it("returns null for a URL with a different bucket", () => {
    const url = "https://other-bucket.s3.eu-west-3.amazonaws.com/public/avatars/user-123/file.webp";
    expect(extractS3KeyFromUrl(url)).toBeNull();
  });

  it("returns null for a completely unrelated URL", () => {
    expect(extractS3KeyFromUrl("https://example.com/image.png")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractS3KeyFromUrl("")).toBeNull();
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
