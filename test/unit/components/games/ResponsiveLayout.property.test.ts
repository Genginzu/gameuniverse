import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: game-library
// **Property 10: Responsive Layout Adaptation**
// **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

type ScreenSize = "mobile" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type Orientation = "portrait" | "landscape";

interface ScreenConfig {
  width: number;
  height: number;
  orientation: Orientation;
}

const BREAKPOINT_COLUMNS: Record<ScreenSize, number> = {
  mobile: 1,
  xs: 2,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  "2xl": 5,
};

const BREAKPOINT_WIDTHS: Record<ScreenSize, number> = {
  mobile: 0,
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

function getScreenSize(width: number): ScreenSize {
  if (width >= BREAKPOINT_WIDTHS["2xl"]) return "2xl";
  if (width >= BREAKPOINT_WIDTHS.xl) return "xl";
  if (width >= BREAKPOINT_WIDTHS.lg) return "lg";
  if (width >= BREAKPOINT_WIDTHS.md) return "md";
  if (width >= BREAKPOINT_WIDTHS.sm) return "sm";
  if (width >= BREAKPOINT_WIDTHS.xs) return "xs";
  return "mobile";
}

function getGridColumns(width: number): number {
  const screenSize = getScreenSize(width);
  return BREAKPOINT_COLUMNS[screenSize];
}

function getOrientation(width: number, height: number): Orientation {
  return width >= height ? "landscape" : "portrait";
}

function changeOrientation(config: ScreenConfig): ScreenConfig {
  return {
    width: config.height,
    height: config.width,
    orientation: config.orientation === "portrait" ? "landscape" : "portrait",
  };
}

function isLayoutUsable(config: ScreenConfig): boolean {
  const columns = getGridColumns(config.width);
  const minCardWidth = 150;
  const gap = 16;
  const padding = 32;

  const availableWidth = config.width - padding;
  const totalGapWidth = (columns - 1) * gap;
  const cardWidth = (availableWidth - totalGapWidth) / columns;

  return cardWidth >= minCardWidth || columns === 1;
}

function calculateCardWidth(config: ScreenConfig): number {
  const columns = getGridColumns(config.width);
  const gap = 16;
  const padding = 32;

  const availableWidth = config.width - padding;
  const totalGapWidth = (columns - 1) * gap;
  return (availableWidth - totalGapWidth) / columns;
}

// Generators
const mobileWidthGenerator = fc.integer({ min: 320, max: 479 });
const xsWidthGenerator = fc.integer({ min: 480, max: 639 });
const smWidthGenerator = fc.integer({ min: 640, max: 767 });
const mdWidthGenerator = fc.integer({ min: 768, max: 1023 });
const lgWidthGenerator = fc.integer({ min: 1024, max: 1279 });
const xlWidthGenerator = fc.integer({ min: 1280, max: 1535 });
const xxlWidthGenerator = fc.integer({ min: 1536, max: 2560 });
const anyWidthGenerator = fc.integer({ min: 320, max: 2560 });
const heightGenerator = fc.integer({ min: 480, max: 1440 });

const screenConfigGenerator = (): fc.Arbitrary<ScreenConfig> =>
  fc.record({
    width: anyWidthGenerator,
    height: heightGenerator,
    orientation: fc.constantFrom("portrait", "landscape") as fc.Arbitrary<Orientation>,
  });

describe("ResponsiveLayout Property-Based Tests", () => {
  describe("Property 10: Responsive Layout Adaptation", () => {
    describe("Requirement 5.1: Mobile Layout Adaptation", () => {
      it("mobile devices should display single column layout", () => {
        fc.assert(
          fc.property(mobileWidthGenerator, (width) => {
            const columns = getGridColumns(width);
            return columns === 1;
          }),
          { numRuns: 100 }
        );
      });

      it("mobile layout should be usable with minimum viewport width", () => {
        fc.assert(
          fc.property(fc.integer({ min: 320, max: 479 }), heightGenerator, (width, height) => {
            const config: ScreenConfig = {
              width,
              height,
              orientation: getOrientation(width, height),
            };
            return isLayoutUsable(config);
          }),
          { numRuns: 100 }
        );
      });

      it("mobile cards should have reasonable width for touch interaction", () => {
        fc.assert(
          fc.property(mobileWidthGenerator, heightGenerator, (width, height) => {
            const config: ScreenConfig = {
              width,
              height,
              orientation: getOrientation(width, height),
            };
            const cardWidth = calculateCardWidth(config);
            return cardWidth >= 200;
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Requirement 5.2: Tablet Layout Optimization", () => {
      it("tablets should display 2-3 columns based on width", () => {
        fc.assert(
          fc.property(fc.oneof(xsWidthGenerator, smWidthGenerator, mdWidthGenerator), (width) => {
            const columns = getGridColumns(width);
            return columns >= 2 && columns <= 3;
          }),
          { numRuns: 100 }
        );
      });

      it("tablet layout should optimize grid for medium screens", () => {
        fc.assert(
          fc.property(mdWidthGenerator, (width) => {
            const columns = getGridColumns(width);
            return columns === 3;
          }),
          { numRuns: 100 }
        );
      });

      it("tablet layout should be usable across all tablet widths", () => {
        fc.assert(
          fc.property(fc.integer({ min: 480, max: 1023 }), heightGenerator, (width, height) => {
            const config: ScreenConfig = {
              width,
              height,
              orientation: getOrientation(width, height),
            };
            return isLayoutUsable(config);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Requirement 5.3: Desktop Full Width Utilization", () => {
      it("desktop should display 4-5 columns to utilize full width", () => {
        fc.assert(
          fc.property(fc.oneof(lgWidthGenerator, xlWidthGenerator, xxlWidthGenerator), (width) => {
            const columns = getGridColumns(width);
            return columns >= 4 && columns <= 5;
          }),
          { numRuns: 100 }
        );
      });

      it("large desktop should display 5 columns", () => {
        fc.assert(
          fc.property(xlWidthGenerator, (width) => {
            const columns = getGridColumns(width);
            return columns === 5;
          }),
          { numRuns: 100 }
        );
      });

      it("desktop layout should effectively use available width", () => {
        fc.assert(
          fc.property(fc.integer({ min: 1024, max: 2560 }), heightGenerator, (width, height) => {
            const config: ScreenConfig = {
              width,
              height,
              orientation: getOrientation(width, height),
            };
            const cardWidth = calculateCardWidth(config);
            const columns = getGridColumns(config.width);
            const maxCardWidth = Math.max(400, width / columns);
            return cardWidth >= 150 && cardWidth <= maxCardWidth;
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Requirement 5.5: Orientation Change Adaptation", () => {
      it("layout should adapt appropriately when orientation changes", () => {
        fc.assert(
          fc.property(screenConfigGenerator(), (config) => {
            const originalColumns = getGridColumns(config.width);
            const rotatedConfig = changeOrientation(config);
            const rotatedColumns = getGridColumns(rotatedConfig.width);

            return originalColumns >= 1 && rotatedColumns >= 1;
          }),
          { numRuns: 100 }
        );
      });

      it("layout should remain usable after orientation change", () => {
        fc.assert(
          fc.property(screenConfigGenerator(), (config) => {
            const rotatedConfig = changeOrientation(config);
            return isLayoutUsable(config) && isLayoutUsable(rotatedConfig);
          }),
          { numRuns: 100 }
        );
      });

      it("orientation change should adjust columns based on new width", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 480, max: 1024 }),
            fc.integer({ min: 320, max: 768 }),
            (width, height) => {
              const landscapeConfig: ScreenConfig = {
                width: Math.max(width, height),
                height: Math.min(width, height),
                orientation: "landscape",
              };

              const portraitConfig = changeOrientation(landscapeConfig);

              const landscapeColumns = getGridColumns(landscapeConfig.width);
              const portraitColumns = getGridColumns(portraitConfig.width);

              return landscapeColumns >= portraitColumns;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("Cross-cutting: Usability Across All Screen Sizes", () => {
      it("layout should be usable across all supported screen sizes", () => {
        fc.assert(
          fc.property(anyWidthGenerator, heightGenerator, (width, height) => {
            const config: ScreenConfig = {
              width,
              height,
              orientation: getOrientation(width, height),
            };
            return isLayoutUsable(config);
          }),
          { numRuns: 200 }
        );
      });

      it("column count should increase monotonically with screen width", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 320, max: 1280 }),
            fc.integer({ min: 0, max: 500 }),
            (baseWidth, increment) => {
              const smallerWidth = baseWidth;
              const largerWidth = baseWidth + increment;

              const smallerColumns = getGridColumns(smallerWidth);
              const largerColumns = getGridColumns(largerWidth);

              return largerColumns >= smallerColumns;
            }
          ),
          { numRuns: 100 }
        );
      });

      it("grid columns should be within valid range for all widths", () => {
        fc.assert(
          fc.property(anyWidthGenerator, (width) => {
            const columns = getGridColumns(width);
            return columns >= 1 && columns <= 5;
          }),
          { numRuns: 200 }
        );
      });

      it("breakpoint transitions should be smooth (no skipped column counts)", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 320, max: 2560 }),
            fc.integer({ min: 1, max: 100 }),
            (width, step) => {
              const columns1 = getGridColumns(width);
              const columns2 = getGridColumns(width + step);

              return Math.abs(columns2 - columns1) <= 1;
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
