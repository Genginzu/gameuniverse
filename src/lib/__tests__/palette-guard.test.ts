import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Guards the "palette only" rule: site colours must come from the palette tokens of
 * src/app/globals.css (Tailwind `palette-*` / `editorial-*` utilities, CSS variables, or the
 * BRAND_COLORS mirror) so a rebrand only touches the palette definitions.
 *
 * Semantic colours (red / green / amber / yellow / orange for errors, success, warnings and
 * rating scales) stay allowed; cool hues (blue, cyan, violet, pink…) are not. Third-party
 * logo colours live as `--color-brand-*` tokens in globals.css (`bg-brand-facebook`…).
 */

const ROOT = join(process.cwd(), "src");
const EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const SKIPPED_DIRS = new Set(["__tests__", "messages"]);
/** Files that define the palette itself. */
const PALETTE_SOURCES = new Set([
  "app/globals.css",
  "lib/utils/brand-colors.ts",
  "lib/database.types.ts",
]);

const FORBIDDEN_TAILWIND =
  /\b[\w:[\]-]*-(?:blue|sky|cyan|teal|indigo|violet|purple|fuchsia|pink)-\d{2,3}\b/g;
const HEX_LITERAL = /#([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?\b/g;
const RGB_LITERAL = /rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/g;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory())
      return SKIPPED_DIRS.has(entry) ? [] : listSourceFiles(fullPath);
    return EXTENSIONS.has(extname(entry)) ? [fullPath] : [];
  });
}

function isCoolHue(red: number, green: number, blue: number): boolean {
  const [r, g, b] = [red / 255, green / 255, blue / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0 || lightness < 0.03 || lightness > 0.97) return false;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / delta + 2) * 60;
  else hue = ((r - g) / delta + 4) * 60;
  return saturation > 0.25 && hue >= 170 && hue <= 330;
}

function findViolations(): string[] {
  return listSourceFiles(ROOT).flatMap((file) => {
    const path = relative(ROOT, file).replace(/\\/g, "/");
    if (PALETTE_SOURCES.has(path)) return [];
    return readFileSync(file, "utf8")
      .split(/\r?\n/)
      .flatMap((line, index) => {
        const hits = [...line.matchAll(FORBIDDEN_TAILWIND)].map((match) => match[0]);
        for (const match of line.matchAll(HEX_LITERAL)) {
          const hex = match[1];
          const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
          if (isCoolHue(channels[0], channels[1], channels[2])) hits.push(match[0]);
        }
        for (const match of line.matchAll(RGB_LITERAL)) {
          if (isCoolHue(+match[1], +match[2], +match[3])) hits.push(match[0]);
        }
        return hits.map((hit) => `src/${path}:${index + 1} → ${hit}`);
      });
  });
}

describe("palette guard", () => {
  it("uses palette tokens instead of hard-coded cool colours", () => {
    expect(findViolations()).toEqual([]);
  });
});
