/**
 * Tests for the color extraction utility used during IGDB game import.
 * Tests the pure color derivation logic (no network calls).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Jimp before importing the module
const mockRead = vi.fn();
vi.mock("jimp", () => ({
  Jimp: { read: mockRead },
}));

// Import after mocking
const { extractColorsFromCover } = await import("../../../scripts/igdb-import/color-extractor");

/** Creates a fake Jimp image that returns specific colors at pixel positions */
function createFakeImage(pixels: Array<[number, number, number]>, width = 20, height = 20) {
  let pixelIndex = 0;
  return {
    width,
    height,
    getPixelColor: (_x: number, _y: number) => {
      const [r, g, b] = pixels[pixelIndex % pixels.length];
      pixelIndex++;
      // Jimp packs as RGBA: (r << 24) | (g << 16) | (b << 8) | a
      return ((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0;
    },
  };
}

describe("extractColorsFromCover", () => {
  beforeEach(() => {
    mockRead.mockReset();
  });

  it("returns null when fetch fails", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 404 }))
    ) as typeof fetch;

    const result = await extractColorsFromCover("https://example.com/cover.jpg");
    expect(result).toBeNull();

    globalThis.fetch = originalFetch;
  });

  it("returns null when image read fails", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(new Uint8Array([0xff, 0xd8, 0xff])))
    ) as typeof fetch;

    mockRead.mockRejectedValue(new Error("Invalid image"));

    const result = await extractColorsFromCover("https://example.com/cover.jpg");
    expect(result).toBeNull();

    globalThis.fetch = originalFetch;
  });

  it("extracts valid hex colors from a palette", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(new Uint8Array([0xff, 0xd8, 0xff])))
    ) as typeof fetch;

    // Mix of colors: dominant dark blue, vibrant red, green, yellow, purple
    const pixels: Array<[number, number, number]> = [
      [30, 40, 80],
      [200, 50, 50],
      [50, 150, 50],
      [200, 200, 50],
      [100, 50, 150],
    ];
    mockRead.mockResolvedValue(createFakeImage(pixels));

    const result = await extractColorsFromCover("https://example.com/cover.jpg");

    expect(result).not.toBeNull();
    expect(result!.background_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(result!.accent_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(result!.label_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(result!.text_color).toMatch(/^#[0-9a-f]{6}$/);

    globalThis.fetch = originalFetch;
  });

  it("produces a dark background color", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(new Uint8Array([0xff, 0xd8, 0xff])))
    ) as typeof fetch;

    const pixels: Array<[number, number, number]> = [
      [100, 120, 200],
      [220, 60, 60],
      [60, 180, 60],
      [200, 200, 60],
      [140, 60, 180],
    ];
    mockRead.mockResolvedValue(createFakeImage(pixels));

    const result = await extractColorsFromCover("https://example.com/cover.jpg");

    const bg = hexToRgb(result!.background_color);
    expect(bg[0]).toBeLessThan(80);
    expect(bg[1]).toBeLessThan(80);
    expect(bg[2]).toBeLessThan(80);

    globalThis.fetch = originalFetch;
  });

  it("produces a light text color for readability", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(new Uint8Array([0xff, 0xd8, 0xff])))
    ) as typeof fetch;

    const pixels: Array<[number, number, number]> = [
      [50, 60, 100],
      [200, 50, 50],
      [50, 150, 50],
      [200, 200, 50],
      [100, 50, 150],
    ];
    mockRead.mockResolvedValue(createFakeImage(pixels));

    const result = await extractColorsFromCover("https://example.com/cover.jpg");

    const text = hexToRgb(result!.text_color);
    expect(text[0]).toBeGreaterThan(180);
    expect(text[1]).toBeGreaterThan(180);
    expect(text[2]).toBeGreaterThan(180);

    globalThis.fetch = originalFetch;
  });
});

/** Helper to convert hex to RGB tuple for assertions */
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
