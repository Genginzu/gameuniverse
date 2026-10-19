import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { BRAND_COLORS } from "@/lib/utils/brand-colors";
import { ORANGE_PALETTE } from "@/lib/utils/accent-palette";

const globalsCss = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function themeHex(scale: string, step: string | number): string | undefined {
  const match = globalsCss.match(
    new RegExp(`--color-palette-${scale}-${step}:\\s*(#[0-9a-fA-F]{6});`)
  );
  return match?.[1].toLowerCase();
}

function neonTriplet(name: string): string | undefined {
  return globalsCss.match(new RegExp(`--neon-${name}:\\s*(\\d+ \\d+ \\d+);`))?.[1];
}

function hexToTriplet(hex: string): string {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)).join(" ");
}

describe("BRAND_COLORS", () => {
  const entries = Object.entries(BRAND_COLORS).flatMap(([scale, steps]) =>
    Object.entries(steps).map(([step, hex]) => ({ scale, step, hex }))
  );

  it.each(entries)(
    "mirrors --color-palette-$scale-$step from globals.css",
    ({ scale, step, hex }) => {
      expect(themeHex(scale, step)).toBe(hex.toLowerCase());
    }
  );
});

describe("neon glow triplets", () => {
  it.each(["primary", "secondary", "accent"])("--neon-%s matches palette %s-500", (name) => {
    const hex = themeHex(name, 500);
    expect(hex).toBeDefined();
    expect(neonTriplet(name)).toBe(hexToTriplet(hex!));
  });

  it("default accent palette is derived from palette primary-500", () => {
    expect(ORANGE_PALETTE.rgbTriplet).toBe(neonTriplet("primary"));
  });
});
