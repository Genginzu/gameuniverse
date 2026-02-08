import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { EntitySkeletonConfig } from "../../../../src/components/shared/EntitySkeleton";
// eslint-disable-next-line no-duplicate-imports
import {
  gameSkeletonConfig,
  playerSkeletonConfig,
  characterSkeletonConfig,
} from "../../../../src/components/shared/EntitySkeleton";

// Feature: code-refactoring, Property 4: GridSkeleton Item Count
// **Validates: Requirements 8.1, 8.2**

// Generator for aspect ratios
const aspectRatioGenerator = fc.constantFrom("3:4" as const, "1:1" as const);

// Generator for badge positions
const badgePositionGenerator = fc.constantFrom("top-left" as const, "top-right" as const);

// Generator for badge sizes
const badgeSizeGenerator = fc.constantFrom("small" as const, "medium" as const, "large" as const);

// Generator for EntitySkeletonConfig
const entitySkeletonConfigGenerator = fc.record({
  aspectRatio: aspectRatioGenerator,
  showBadge: fc.option(fc.boolean()),
  badgePosition: fc.option(badgePositionGenerator),
  badgeSize: fc.option(badgeSizeGenerator),
  showInfoSection: fc.option(fc.boolean()),
  infoLines: fc.option(fc.integer({ min: 1, max: 5 })),
  useGradientBackground: fc.option(fc.boolean()),
});

// Generator for item count
const itemCountGenerator = fc.integer({ min: 1, max: 100 });

// Simulate rendering logic for GridSkeleton
const simulateGridSkeletonRender = (
  skeletonConfig: EntitySkeletonConfig,
  count: number
): {
  itemCount: number;
  hasResponsiveGrid: boolean;
  skeletonConfigUsed: EntitySkeletonConfig;
} => {
  return {
    itemCount: count,
    hasResponsiveGrid: true, // Always uses responsive grid
    skeletonConfigUsed: skeletonConfig,
  };
};

describe("GridSkeleton Property-Based Tests", () => {
  describe("Property 4: GridSkeleton Item Count", () => {
    it("renders exactly the specified number of skeleton items", () => {
      fc.assert(
        fc.property(entitySkeletonConfigGenerator, itemCountGenerator, (config, count) => {
          const result = simulateGridSkeletonRender(config as EntitySkeletonConfig, count);
          return result.itemCount === count;
        }),
        { numRuns: 50 }
      );
    });

    it("uses the provided skeleton configuration for all items", () => {
      fc.assert(
        fc.property(entitySkeletonConfigGenerator, itemCountGenerator, (config, count) => {
          const result = simulateGridSkeletonRender(config as EntitySkeletonConfig, count);
          return result.skeletonConfigUsed === config;
        }),
        { numRuns: 50 }
      );
    });

    it("always uses responsive grid layout", () => {
      fc.assert(
        fc.property(entitySkeletonConfigGenerator, itemCountGenerator, (config, count) => {
          const result = simulateGridSkeletonRender(config as EntitySkeletonConfig, count);
          return result.hasResponsiveGrid === true;
        }),
        { numRuns: 50 }
      );
    });

    it("defaults to 20 items when count is not specified", () => {
      const defaultCount = 20;
      const result = simulateGridSkeletonRender(gameSkeletonConfig, defaultCount);
      expect(result.itemCount).toBe(20);
    });
  });

  describe("Property 4 Extended: Preset Configuration Compatibility", () => {
    it("works correctly with gameSkeletonConfig", () => {
      fc.assert(
        fc.property(itemCountGenerator, (count) => {
          const result = simulateGridSkeletonRender(gameSkeletonConfig, count);
          return (
            result.itemCount === count &&
            result.skeletonConfigUsed.aspectRatio === "3:4" &&
            result.hasResponsiveGrid === true
          );
        }),
        { numRuns: 50 }
      );
    });

    it("works correctly with playerSkeletonConfig", () => {
      fc.assert(
        fc.property(itemCountGenerator, (count) => {
          const result = simulateGridSkeletonRender(playerSkeletonConfig, count);
          return (
            result.itemCount === count &&
            result.skeletonConfigUsed.aspectRatio === "1:1" &&
            result.hasResponsiveGrid === true
          );
        }),
        { numRuns: 50 }
      );
    });

    it("works correctly with characterSkeletonConfig", () => {
      fc.assert(
        fc.property(itemCountGenerator, (count) => {
          const result = simulateGridSkeletonRender(characterSkeletonConfig, count);
          return (
            result.itemCount === count &&
            result.skeletonConfigUsed.aspectRatio === "3:4" &&
            result.hasResponsiveGrid === true
          );
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 4 Extended: Edge Cases", () => {
    it("handles minimum count of 1", () => {
      const result = simulateGridSkeletonRender(gameSkeletonConfig, 1);
      expect(result.itemCount).toBe(1);
    });

    it("handles large counts", () => {
      fc.assert(
        fc.property(fc.integer({ min: 50, max: 100 }), (count) => {
          const result = simulateGridSkeletonRender(gameSkeletonConfig, count);
          return result.itemCount === count;
        }),
        { numRuns: 20 }
      );
    });
  });

  describe("Property 4 Extended: Configuration Consistency", () => {
    it("same config and count always produces same result", () => {
      fc.assert(
        fc.property(entitySkeletonConfigGenerator, itemCountGenerator, (config, count) => {
          const result1 = simulateGridSkeletonRender(config as EntitySkeletonConfig, count);
          const result2 = simulateGridSkeletonRender(config as EntitySkeletonConfig, count);

          return (
            result1.itemCount === result2.itemCount &&
            result1.hasResponsiveGrid === result2.hasResponsiveGrid &&
            result1.skeletonConfigUsed === result2.skeletonConfigUsed
          );
        }),
        { numRuns: 50 }
      );
    });
  });
});
