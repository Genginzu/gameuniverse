/**
 * Color extraction from game cover images.
 *
 * Downloads a cover image, samples pixels to build a palette,
 * and derives background/accent/label/text colors using HSL manipulation.
 * Uses Jimp (pure JS) so it works in both Bun scripts and Next.js route handlers.
 */

import { Jimp } from "jimp";
import { logger } from "@/lib/logger";

/** RGB color tuple */
type RGB = [number, number, number];

/** Extracted game colors as hex strings */
export interface ExtractedGameColors {
  background_color: string;
  accent_color: string;
  label_color: string;
  text_color: string;
}

/**
 * Upgrades a cover URL to a larger size for better color sampling.
 * Uses t_cover_big_2x (528×748) — good balance between quality and speed.
 * Avoids t_720p (1280×720) which is much slower to download and process.
 */
function upgradeImageUrl(coverUrl: string): string {
  return coverUrl.replace("/t_cover_big/", "/t_cover_big_2x/");
}

/**
 * Extracts colors from a cover image URL.
 * Uses a larger image (720p) and pixel sampling for accurate extraction.
 * Returns null if extraction fails (network error, invalid image, etc.)
 */
export async function extractColorsFromCover(
  coverUrl: string,
  _verbose: boolean = false,
  variantIndex: number = 0,
): Promise<ExtractedGameColors | null> {
  try {
    const largeUrl = upgradeImageUrl(coverUrl);

    const response = await fetch(largeUrl);
    if (!response.ok) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const image = await Jimp.read(buffer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const palette = extractPalette(image as any, 10);

    if (palette.length === 0) {
      return null;
    }

    const colors = deriveGameColors(palette, variantIndex);

    return colors;
  } catch (error) {
    logger.error("[ColorExtractor] Error extracting colors", {
      error: error instanceof Error ? error.stack || error.message : error,
    });
    return null;
  }
}

/**
 * Extracts a color palette from an image by sampling pixels
 * and clustering them using a simplified median-cut algorithm.
 */
function extractPalette(image: InstanceType<typeof Jimp>, count: number): RGB[] {
  const width = image.width;
  const height = image.height;
  const pixels: RGB[] = [];

  // Sample every 4th pixel for performance
  const step = 4;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const color = image.getPixelColor(x, y);
      const r = (color >> 24) & 0xff;
      const g = (color >> 16) & 0xff;
      const b = (color >> 8) & 0xff;
      // Skip near-black and near-white pixels
      if (r + g + b > 30 && r + g + b < 720) {
        pixels.push([r, g, b]);
      }
    }
  }

  if (pixels.length === 0) return [];

  return medianCut(pixels, count);
}

/**
 * Simplified median-cut quantization to reduce pixels to N representative colors.
 */
function medianCut(pixels: RGB[], maxColors: number): RGB[] {
  type Bucket = RGB[];
  const buckets: Bucket[] = [pixels];

  while (buckets.length < maxColors) {
    // Find the bucket with the widest color range
    let widestIdx = 0;
    let widestRange = 0;

    for (let i = 0; i < buckets.length; i++) {
      const range = getColorRange(buckets[i]);
      if (range.maxRange > widestRange) {
        widestRange = range.maxRange;
        widestIdx = i;
      }
    }

    const bucket = buckets[widestIdx];
    if (bucket.length < 2) break;

    const range = getColorRange(bucket);
    // Sort by the channel with the widest range
    bucket.sort((a, b) => a[range.channel] - b[range.channel]);

    const mid = Math.floor(bucket.length / 2);
    buckets.splice(widestIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  // Average each bucket to get the representative color
  return buckets.map((bucket) => {
    let rSum = 0,
      gSum = 0,
      bSum = 0;
    for (const [r, g, b] of bucket) {
      rSum += r;
      gSum += g;
      bSum += b;
    }
    const len = bucket.length;
    return [Math.round(rSum / len), Math.round(gSum / len), Math.round(bSum / len)] as RGB;
  });
}

/** Finds which RGB channel has the widest range in a set of pixels */
function getColorRange(pixels: RGB[]): { channel: 0 | 1 | 2; maxRange: number } {
  let rMin = 255,
    rMax = 0,
    gMin = 255,
    gMax = 0,
    bMin = 255,
    bMax = 0;

  for (const [r, g, b] of pixels) {
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }

  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;

  if (rRange >= gRange && rRange >= bRange) return { channel: 0, maxRange: rRange };
  if (gRange >= rRange && gRange >= bRange) return { channel: 1, maxRange: gRange };
  return { channel: 2, maxRange: bRange };
}

/**
 * Derives the 4 game colors from a palette.
 *
 * Strategy:
 * - Finds the most vibrant color (high saturation + good lightness)
 * - background: tinted with the vibrant hue, very dark
 * - accent: the vibrant color, boosted to be punchy
 * - label: muted version of the vibrant hue
 * - text: near-white tinted slightly with the dominant hue
 */
function deriveGameColors(palette: RGB[], variantIndex = 0): ExtractedGameColors {
  const dominantHsl = rgbToHsl(palette[0]);
  const ranked = rankByVibrancy(palette);
  const vibrant = ranked[Math.min(variantIndex, ranked.length - 1)];
  const vibrantHsl = rgbToHsl(vibrant);

  const background = hslToRgb(vibrantHsl[0], clamp(vibrantHsl[1] * 0.5, 0.15, 0.45), 0.1);

  const accent = hslToRgb(
    vibrantHsl[0],
    clamp(vibrantHsl[1] * 1.3, 0.7, 1.0),
    clamp(vibrantHsl[2], 0.45, 0.6)
  );

  const label = hslToRgb(vibrantHsl[0], 0.2, 0.55);
  const text = hslToRgb(dominantHsl[0], 0.08, 0.9);

  return {
    background_color: rgbToHex(background),
    accent_color: rgbToHex(accent),
    label_color: rgbToHex(label),
    text_color: rgbToHex(text),
  };
}

/**
 * Ranks palette colors by vibrancy (most vibrant first).
 */
function rankByVibrancy(palette: RGB[]): RGB[] {
  const scored = palette.map((color) => {
    const [, s, l] = rgbToHsl(color);
    if (l < 0.1 || l > 0.9) return { color, score: -1 };
    const satWeight = s * s;
    const lightBonus = 1 - Math.abs(l - 0.5) * 1.6;
    return { color, score: satWeight * (0.5 + 0.5 * Math.max(lightBonus, 0)) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.color);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// --- HSL conversion utilities ---

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToChannel(p, q, h + 1 / 3) * 255),
    Math.round(hueToChannel(p, q, h) * 255),
    Math.round(hueToChannel(p, q, h - 1 / 3) * 255),
  ];
}

function hueToChannel(p: number, q: number, t: number): number {
  let tn = t;
  if (tn < 0) tn += 1;
  if (tn > 1) tn -= 1;
  if (tn < 1 / 6) return p + (q - p) * 6 * tn;
  if (tn < 1 / 2) return q;
  if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
  return p;
}

function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, v));
  return "#" + [c(r), c(g), c(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
