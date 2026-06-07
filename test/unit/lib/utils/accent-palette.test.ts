import { describe, it, expect } from "vitest";
import {
  paletteFromHex,
  DEFAULT_PALETTE,
  MAGENTA_PALETTE,
  CYBERPUNK_PALETTE,
  VALORANT_PALETTE,
  GOLD_PALETTE,
  CYAN_PALETTE,
} from "@/lib/utils/accent-palette";

describe("accent-palette", () => {
  describe("paletteFromHex", () => {
    it("returns DEFAULT_PALETTE when input is null", () => {
      expect(paletteFromHex(null)).toBe(DEFAULT_PALETTE);
    });

    it("returns DEFAULT_PALETTE when input is undefined", () => {
      expect(paletteFromHex(undefined)).toBe(DEFAULT_PALETTE);
    });

    it("returns DEFAULT_PALETTE when input is empty string", () => {
      expect(paletteFromHex("")).toBe(DEFAULT_PALETTE);
    });

    it("returns DEFAULT_PALETTE when input contains non-hex characters", () => {
      expect(paletteFromHex("#zzzzzz")).toBe(DEFAULT_PALETTE);
      expect(paletteFromHex("not a color")).toBe(DEFAULT_PALETTE);
      expect(paletteFromHex("#ab")).toBe(DEFAULT_PALETTE);
      expect(paletteFromHex("#abcd")).toBe(DEFAULT_PALETTE);
    });

    it("accepts a 6-digit hex with leading #", () => {
      const palette = paletteFromHex("#ff4655");
      expect(palette.rgbTriplet).toBe("255 70 85");
    });

    it("accepts a 6-digit hex without leading #", () => {
      const palette = paletteFromHex("ff4655");
      expect(palette.rgbTriplet).toBe("255 70 85");
    });

    it("accepts a 3-digit hex", () => {
      const palette = paletteFromHex("#f80");
      // #f80 expands to #ff8800 → 255 136 0
      expect(palette.rgbTriplet).toBe("255 136 0");
    });

    it("returns a complete scale 50..900", () => {
      const palette = paletteFromHex("#ff4655");
      const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
      keys.forEach((key) => {
        expect(palette.scale[key]).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it("uses the provided name when given", () => {
      const palette = paletteFromHex("#ff4655", "valorant");
      expect(palette.name).toBe("valorant");
    });

    it("defaults the name to 'custom' when not provided", () => {
      const palette = paletteFromHex("#ff4655");
      expect(palette.name).toBe("custom");
    });

    it("produces lighter values at lower indices and darker at higher", () => {
      const palette = paletteFromHex("#0066cc");
      // Crude brightness check : convert each hex to its average channel value.
      const brightness = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r + g + b) / 3;
      };
      const b50 = brightness(palette.scale[50]);
      const b500 = brightness(palette.scale[500]);
      const b900 = brightness(palette.scale[900]);
      expect(b50).toBeGreaterThan(b500);
      expect(b500).toBeGreaterThan(b900);
    });

    it("preserves the input as rgbTriplet (not the L=0.5 mid-tone)", () => {
      // The triplet is the original color, even if scale[500] is normalized
      // to a 0.5 lightness mid-tone.
      const palette = paletteFromHex("#ff4655");
      expect(palette.rgbTriplet).toBe("255 70 85");
    });

    it("handles pure black", () => {
      const palette = paletteFromHex("#000000");
      expect(palette.rgbTriplet).toBe("0 0 0");
      // All shades of a saturationless color should be greys.
      expect(palette.scale[500]).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("handles pure white", () => {
      const palette = paletteFromHex("#ffffff");
      expect(palette.rgbTriplet).toBe("255 255 255");
    });
  });

  describe("predefined palettes", () => {
    it("MAGENTA_PALETTE has the expected scale", () => {
      expect(MAGENTA_PALETTE.name).toBe("magenta");
      expect(MAGENTA_PALETTE.rgbTriplet).toBe("194 51 203");
      expect(MAGENTA_PALETTE.scale[500]).toBe("#c233cb");
    });

    it("CYBERPUNK_PALETTE is yellow", () => {
      expect(CYBERPUNK_PALETTE.name).toBe("cyberpunk-yellow");
      expect(CYBERPUNK_PALETTE.scale[500]).toBe("#f5d40c");
    });

    it("VALORANT_PALETTE is red", () => {
      expect(VALORANT_PALETTE.name).toBe("valorant-red");
      expect(VALORANT_PALETTE.scale[400]).toBe("#ff4655");
    });

    it("GOLD_PALETTE has scale[400] matching Tailwind amber-400", () => {
      expect(GOLD_PALETTE.scale[400]).toBe("#fbbf24");
    });

    it("CYAN_PALETTE is cyan", () => {
      expect(CYAN_PALETTE.name).toBe("cyan");
      expect(CYAN_PALETTE.scale[500]).toBe("#10b8a3");
    });

    it("DEFAULT_PALETTE points to MAGENTA_PALETTE", () => {
      expect(DEFAULT_PALETTE).toBe(MAGENTA_PALETTE);
    });
  });
});
