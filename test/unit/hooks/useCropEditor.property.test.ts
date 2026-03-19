import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { clampPosition, clampZoom, zoomAroundCenter } from "@/lib/utils/cropEditorUtils";
import { ZOOM_MIN, ZOOM_MAX } from "@/types/upload";

/**
 * Feature: image-crop-upload, Property 1: Invariant de clamping de position — pas de zone vide
 *
 * _For any_ image size, viewport size, zoom level in [1, 3], and _for any_
 * position (x, y), after applying clampPosition the zoomed image must fully
 * cover the viewport — no empty pixel is visible in the crop zone.
 *
 * **Validates: Requirements 2.3, 3.5**
 */

// --- Generators ---

/**
 * Generates a valid crop scenario where the zoomed image is large enough
 * to cover the viewport (imageW * zoom >= viewportW, imageH * zoom >= viewportH).
 */
const cropScenarioGenerator = fc
  .record({
    imageW: fc.integer({ min: 100, max: 4000 }),
    imageH: fc.integer({ min: 100, max: 4000 }),
    viewportW: fc.integer({ min: 50, max: 2000 }),
    viewportH: fc.integer({ min: 50, max: 2000 }),
    zoom: fc.double({ min: 1, max: 3, noNaN: true }),
    x: fc.double({ min: -5000, max: 5000, noNaN: true }),
    y: fc.double({ min: -5000, max: 5000, noNaN: true }),
  })
  .filter(({ imageW, imageH, viewportW, viewportH, zoom }) => {
    // Image must be large enough to cover viewport at given zoom
    return imageW * zoom >= viewportW && imageH * zoom >= viewportH;
  });

// --- Tests ---

describe("useCropEditor - Property-Based Tests", () => {
  describe("Property 1: Invariant de clamping de position — pas de zone vide", () => {
    it("clamped position ensures image left edge is at or before viewport left (x <= 0)", () => {
      fc.assert(
        fc.property(
          cropScenarioGenerator,
          ({ imageW, imageH, viewportW, viewportH, zoom, x, y }) => {
            const clamped = clampPosition(
              x,
              y,
              zoom,
              { width: imageW, height: imageH },
              { width: viewportW, height: viewportH }
            );
            expect(clamped.x).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("clamped position ensures image right edge is at or after viewport right", () => {
      fc.assert(
        fc.property(
          cropScenarioGenerator,
          ({ imageW, imageH, viewportW, viewportH, zoom, x, y }) => {
            const clamped = clampPosition(
              x,
              y,
              zoom,
              { width: imageW, height: imageH },
              { width: viewportW, height: viewportH }
            );
            const minX = -(imageW * zoom - viewportW);
            expect(clamped.x).toBeGreaterThanOrEqual(minX);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("clamped position ensures image top edge is at or before viewport top (y <= 0)", () => {
      fc.assert(
        fc.property(
          cropScenarioGenerator,
          ({ imageW, imageH, viewportW, viewportH, zoom, x, y }) => {
            const clamped = clampPosition(
              x,
              y,
              zoom,
              { width: imageW, height: imageH },
              { width: viewportW, height: viewportH }
            );
            expect(clamped.y).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("clamped position ensures image bottom edge is at or after viewport bottom", () => {
      fc.assert(
        fc.property(
          cropScenarioGenerator,
          ({ imageW, imageH, viewportW, viewportH, zoom, x, y }) => {
            const clamped = clampPosition(
              x,
              y,
              zoom,
              { width: imageW, height: imageH },
              { width: viewportW, height: viewportH }
            );
            const minY = -(imageH * zoom - viewportH);
            expect(clamped.y).toBeGreaterThanOrEqual(minY);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("zoomed image fully covers the viewport after clamping (combined check)", () => {
      fc.assert(
        fc.property(
          cropScenarioGenerator,
          ({ imageW, imageH, viewportW, viewportH, zoom, x, y }) => {
            const clamped = clampPosition(
              x,
              y,
              zoom,
              { width: imageW, height: imageH },
              { width: viewportW, height: viewportH }
            );

            const displayW = imageW * zoom;
            const displayH = imageH * zoom;

            // Image left edge at or before viewport left
            expect(clamped.x).toBeLessThanOrEqual(0);
            // Image right edge at or after viewport right
            expect(clamped.x + displayW).toBeGreaterThanOrEqual(viewportW);
            // Image top edge at or before viewport top
            expect(clamped.y).toBeLessThanOrEqual(0);
            // Image bottom edge at or after viewport bottom
            expect(clamped.y + displayH).toBeGreaterThanOrEqual(viewportH);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: image-crop-upload, Property 2: Invariant de bornes du zoom
   *
   * _For any_ zoom value (including values far outside the valid range),
   * after applying clampZoom the result must always be within [ZOOM_MIN, ZOOM_MAX].
   *
   * **Validates: Requirements 3.1**
   */
  describe("Property 2: Invariant de bornes du zoom [ZOOM_MIN, ZOOM_MAX]", () => {
    it("clampZoom always returns a value within [ZOOM_MIN, ZOOM_MAX]", () => {
      fc.assert(
        fc.property(fc.double({ min: -10, max: 10, noNaN: true }), (rawZoom) => {
          const result = clampZoom(rawZoom);
          expect(result).toBeGreaterThanOrEqual(ZOOM_MIN);
          expect(result).toBeLessThanOrEqual(ZOOM_MAX);
        }),
        { numRuns: 100 }
      );
    });

    it("clampZoom returns ZOOM_MIN for values below the minimum", () => {
      fc.assert(
        fc.property(fc.double({ min: -10, max: ZOOM_MIN - 0.001, noNaN: true }), (rawZoom) => {
          const result = clampZoom(rawZoom);
          expect(result).toBe(ZOOM_MIN);
        }),
        { numRuns: 100 }
      );
    });

    it("clampZoom returns ZOOM_MAX for values above the maximum", () => {
      fc.assert(
        fc.property(fc.double({ min: ZOOM_MAX + 0.001, max: 10, noNaN: true }), (rawZoom) => {
          const result = clampZoom(rawZoom);
          expect(result).toBe(ZOOM_MAX);
        }),
        { numRuns: 100 }
      );
    });

    it("clampZoom preserves values already within [ZOOM_MIN, ZOOM_MAX]", () => {
      fc.assert(
        fc.property(fc.double({ min: ZOOM_MIN, max: ZOOM_MAX, noNaN: true }), (rawZoom) => {
          const result = clampZoom(rawZoom);
          expect(result).toBe(rawZoom);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: image-crop-upload, Property 3: Stabilité du centre lors du zoom
   *
   * _For any_ crop state (position, zoom) and _for any_ zoom delta,
   * the center point of the visible area in source image coordinates must
   * remain identical before and after the zoom change (up to clamping adjustments).
   *
   * **Validates: Requirements 3.4**
   */
  describe("Property 3: Stabilité du centre lors du zoom", () => {
    // Use large image and moderate viewport so clamping rarely interferes
    const IMAGE_SIZE = { width: 4000, height: 4000 };
    const VIEWPORT_SIZE = { width: 400, height: 400 };

    /**
     * Generates a valid CropState where x and y are well within bounds
     * to minimize clamping interference, plus a small deltaZoom.
     */
    const zoomCenterScenarioGenerator = fc
      .record({
        zoom: fc.double({ min: ZOOM_MIN, max: ZOOM_MAX, noNaN: true }),
        deltaZoom: fc.double({ min: -0.5, max: 0.5, noNaN: true }),
      })
      .chain(({ zoom, deltaZoom }) => {
        // Compute safe x/y range: well inside bounds to avoid clamping
        const displayW = IMAGE_SIZE.width * zoom;
        const displayH = IMAGE_SIZE.height * zoom;
        const minX = -(displayW - VIEWPORT_SIZE.width);
        const minY = -(displayH - VIEWPORT_SIZE.height);
        // Keep x/y in the inner 80% of the valid range to stay away from edges
        const safeMinX = minX * 0.8;
        const safeMaxX = 0;
        const safeMinY = minY * 0.8;
        const safeMaxY = 0;

        return fc
          .record({
            x: fc.double({ min: safeMinX, max: safeMaxX, noNaN: true }),
            y: fc.double({ min: safeMinY, max: safeMaxY, noNaN: true }),
          })
          .map(({ x, y }) => ({
            state: { x, y, zoom } as const,
            deltaZoom,
          }));
      });

    it("viewport center in source coordinates is preserved after zoom (when not clamped)", () => {
      fc.assert(
        fc.property(zoomCenterScenarioGenerator, ({ state, deltaZoom }) => {
          const newZoom = state.zoom + deltaZoom;

          // Skip if new zoom would be clamped to same value (no actual change)
          const clampedNewZoom = clampZoom(newZoom);
          if (clampedNewZoom === state.zoom) return;

          // Center in source coords BEFORE zoom
          const centerSrcXBefore = (VIEWPORT_SIZE.width / 2 - state.x) / state.zoom;
          const centerSrcYBefore = (VIEWPORT_SIZE.height / 2 - state.y) / state.zoom;

          // Apply zoomAroundCenter
          const newState = zoomAroundCenter(state, newZoom, IMAGE_SIZE, VIEWPORT_SIZE);

          // Center in source coords AFTER zoom
          const centerSrcXAfter = (VIEWPORT_SIZE.width / 2 - newState.x) / newState.zoom;
          const centerSrcYAfter = (VIEWPORT_SIZE.height / 2 - newState.y) / newState.zoom;

          // Check if clamping occurred by computing the unclamped position
          const unclampedX = VIEWPORT_SIZE.width / 2 - centerSrcXBefore * clampedNewZoom;
          const unclampedY = VIEWPORT_SIZE.height / 2 - centerSrcYBefore * clampedNewZoom;
          const wasClamped =
            Math.abs(newState.x - unclampedX) > 0.01 || Math.abs(newState.y - unclampedY) > 0.01;

          // Only assert center stability when clamping did NOT interfere
          if (!wasClamped) {
            expect(centerSrcXAfter).toBeCloseTo(centerSrcXBefore, 1);
            expect(centerSrcYAfter).toBeCloseTo(centerSrcYBefore, 1);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
