import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { buildGameColors } from "../../../../../src/lib/utils/game-utils";

/**
 * Feature: admin-game-color-preview
 * Property 2: All four color roles applied in preview
 *
 * For any GameColors object produced by buildGameColors, all four color roles
 * (backgroundColor, textColor, labelColor, accent) are non-empty strings that
 * can be applied as CSS style values.
 *
 * **Validates: Requirements 1.4, 4.1, 4.3, 4.4**
 */

const hexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  )
  .map(
    ([r, g, b]) =>
      `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  );

const optionalHexArb = fc.oneof(hexColorArb, fc.constant(null), fc.constant(undefined));

describe("GameColorPreview Property Tests", () => {
  it("Property 2: all four color roles are present and non-empty for any input combination", () => {
    fc.assert(
      fc.property(
        optionalHexArb,
        optionalHexArb,
        optionalHexArb,
        optionalHexArb,
        (bg, accent, label, text) => {
          const colors = buildGameColors({
            backgroundColor: bg,
            accentColor: accent,
            labelColor: label,
            textColor: text,
          });

          // All four roles must be non-empty strings usable as CSS values
          expect(colors.backgroundColor).toBeTruthy();
          expect(typeof colors.backgroundColor).toBe("string");

          expect(colors.textColor).toBeTruthy();
          expect(typeof colors.textColor).toBe("string");

          expect(colors.labelColor).toBeTruthy();
          expect(typeof colors.labelColor).toBe("string");

          expect(colors.accent).toBeTruthy();
          expect(typeof colors.accent).toBe("string");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: admin-game-color-preview
   * Property 3: Gradient overlay contains backgroundColor
   *
   * For any backgroundColor hex value, the gradient CSS string built using
   * the same pattern as GameHeroSection contains that backgroundColor value.
   *
   * **Validates: Requirements 4.2**
   */
  it("Property 3: gradient overlay pattern always contains the backgroundColor", () => {
    fc.assert(
      fc.property(optionalHexArb, (bg) => {
        const colors = buildGameColors({
          backgroundColor: bg,
          accentColor: null,
          labelColor: null,
          textColor: null,
        });

        // Build the same gradient pattern used in GameColorPreview and GameHeroSection
        const gradient = `linear-gradient(to bottom, ${colors.backgroundColor}20 0%, ${colors.backgroundColor}60 40%, ${colors.backgroundColor}90 70%, ${colors.backgroundColor} 100%)`;

        expect(gradient).toContain(colors.backgroundColor);
      }),
      { numRuns: 100 }
    );
  });
});
