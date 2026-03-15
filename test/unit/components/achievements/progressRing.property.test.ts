import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeArcOffset } from "@/components/players/ProgressRing";

// Feature: achievements-system, Property 6: Progress ring arc proportionality

/**
 * Property 6: Progress ring arc proportionality
 *
 * For any progress percentage p in [0, 100], the SVG stroke-dashoffset
 * computed by computeArcOffset must produce a visible arc whose length
 * is proportional to p relative to the full perimeter of the rounded rect.
 *
 * **Validates: Requirements 5.2**
 */
describe("Property 6: Progress ring arc proportionality", () => {
  const percentGen = fc.double({ min: 0, max: 100, noNaN: true });
  const sizeGen = fc.integer({ min: 20, max: 500 });
  const strokeWidthGen = fc.integer({ min: 1, max: 10 });
  const borderRadiusGen = fc.integer({ min: 0, max: 30 });

  it("offset equals circumference * (1 - p/100) for any p in [0, 100]", () => {
    fc.assert(
      fc.property(percentGen, sizeGen, strokeWidthGen, borderRadiusGen, (p, size, sw, br) => {
        fc.pre(size > sw);

        const { circumference, offset } = computeArcOffset(p, size, sw, br);
        const expected = circumference * (1 - p / 100);

        expect(offset).toBeCloseTo(expected, 8);
      }),
      { numRuns: 100 }
    );
  });

  it("offset equals circumference when p = 0 (no visible arc)", () => {
    fc.assert(
      fc.property(sizeGen, strokeWidthGen, borderRadiusGen, (size, sw, br) => {
        fc.pre(size > sw);

        const { circumference, offset } = computeArcOffset(0, size, sw, br);

        expect(offset).toBeCloseTo(circumference, 8);
      }),
      { numRuns: 100 }
    );
  });

  it("offset equals 0 when p = 100 (full arc)", () => {
    fc.assert(
      fc.property(sizeGen, strokeWidthGen, borderRadiusGen, (size, sw, br) => {
        fc.pre(size > sw);

        const { circumference, offset } = computeArcOffset(100, size, sw, br);

        expect(offset).toBeCloseTo(0, 8);
        expect(circumference).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("offset is always in [0, circumference]", () => {
    fc.assert(
      fc.property(percentGen, sizeGen, strokeWidthGen, borderRadiusGen, (p, size, sw, br) => {
        fc.pre(size > sw);

        const { circumference, offset } = computeArcOffset(p, size, sw, br);

        expect(offset).toBeGreaterThanOrEqual(-1e-10);
        expect(offset).toBeLessThanOrEqual(circumference + 1e-10);
      }),
      { numRuns: 100 }
    );
  });
});
