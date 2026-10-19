import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("jimp", () => ({ Jimp: { read: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

import { extractColorsFromCover } from "@/lib/utils/color-extraction";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("extractColorsFromCover", () => {
  it("returns null on fetch failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const result = await extractColorsFromCover("https://images.igdb.com/t_cover_big/abc.jpg");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const result = await extractColorsFromCover("https://images.igdb.com/t_cover_big/abc.jpg");
    expect(result).toBeNull();
  });

  it("upgrades URL to cover_big_2x", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await extractColorsFromCover("https://images.igdb.com/t_cover_big/abc.jpg");
    expect(fetch).toHaveBeenCalledWith(
      "https://images.igdb.com/t_cover_big_2x/abc.jpg",
      expect.objectContaining({ redirect: "error" })
    );
  });

  it.each([
    "http://169.254.169.254/latest/meta-data/",
    "http://images.igdb.com/t_cover_big/abc.jpg",
    "https://127.0.0.1:54321/storage/v1/object/public/a.png",
    "https://evil.example/cover.jpg",
    "not a url",
  ])("refuses to fetch a non-allowlisted URL: %s", async (url) => {
    globalThis.fetch = vi.fn();
    await expect(extractColorsFromCover(url)).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
