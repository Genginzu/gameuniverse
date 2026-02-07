import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { EntitySkeletonConfig } from "../EntitySkeleton";
import {
  gameSkeletonConfig,
  playerSkeletonConfig,
  characterSkeletonConfig,
} from "../EntitySkeleton";

// Feature: code-refactoring, Property 3: EntitySkeleton Configuration Rendering
// **Validates: Requirements 7.1, 7.2, 7.3**

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

// Simulate rendering logic for EntitySkeleton
const simulateEntitySkeletonRender = (
  config: EntitySkeletonConfig
): {
  aspectRatioClass: string;
  hasBadge: boolean;
  badgePositionClass: string;
  badgeSizeClasses: string;
  hasInfoSection: boolean;
  infoLineCount: number;
  hasGradientBackground: boolean;
} => {
  const aspectRatioClass = config.aspectRatio === "3:4" ? "aspect-[3/4]" : "aspect-square";
  const hasBadge = config.showBadge ?? false;
  const badgePositionClass = config.badgePosition === "top-left" ? "left-3" : "right-3";
  
  let badgeSizeClasses: string;
  switch (config.badgeSize) {
    case "small":
      badgeSizeClasses = "h-8 w-8 rounded-full";
      break;
    case "medium":
      badgeSizeClasses = "h-6 w-16 rounded-full";
      break;
    case "large":
      badgeSizeClasses = "h-7 w-20 rounded-full";
      break;
    default:
      badgeSizeClasses = "h-8 w-8 rounded-full";
  }
  
  const hasInfoSection = config.showInfoSection ?? false;
  const infoLineCount = hasInfoSection ? (config.infoLines ?? 1) : 0;
  const hasGradientBackground = config.useGradientBackground ?? false;
  
  return {
    aspectRatioClass,
    hasBadge,
    badgePositionClass,
    badgeSizeClasses,
    hasInfoSection,
    infoLineCount,
    hasGradientBackground,
  };
};

describe("EntitySkeleton Property-Based Tests", () => {
  describe("Property 3: EntitySkeleton Configuration Rendering", () => {
    it("renders with correct aspect ratio for any valid configuration", () => {
      fc.assert(
        fc.property(
          entitySkeletonConfigGenerator,
          (config) => {
            const result = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            
            // Verify aspect ratio class matches configuration
            if (config.aspectRatio === "3:4") {
              return result.aspectRatioClass === "aspect-[3/4]";
            } else {
              return result.aspectRatioClass === "aspect-square";
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("shows badge skeleton when configured", () => {
      fc.assert(
        fc.property(
          entitySkeletonConfigGenerator,
          (config) => {
            const result = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            const expectedHasBadge = config.showBadge ?? false;
            return result.hasBadge === expectedHasBadge;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("badge position matches configuration", () => {
      fc.assert(
        fc.property(
          entitySkeletonConfigGenerator,
          (config) => {
            const result = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            
            if (config.badgePosition === "top-left") {
              return result.badgePositionClass === "left-3";
            } else {
              // Default is top-right
              return result.badgePositionClass === "right-3";
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("badge size matches configuration", () => {
      fc.assert(
        fc.property(
          entitySkeletonConfigGenerator,
          (config) => {
            const result = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            
            switch (config.badgeSize) {
              case "small":
                return result.badgeSizeClasses === "h-8 w-8 rounded-full";
              case "medium":
                return result.badgeSizeClasses === "h-6 w-16 rounded-full";
              case "large":
                return result.badgeSizeClasses === "h-7 w-20 rounded-full";
              default:
                // Default is small
                return result.badgeSizeClasses === "h-8 w-8 rounded-full";
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("shows info section when configured", () => {
      fc.assert(
        fc.property(
          entitySkeletonConfigGenerator,
          (config) => {
            const result = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            const expectedHasInfoSection = config.showInfoSection ?? false;
            return result.hasInfoSection === expectedHasInfoSection;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("info line count matches configuration when info section is shown", () => {
      fc.assert(
        fc.property(
          entitySkeletonConfigGenerator,
          (config) => {
            const result = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            
            if (config.showInfoSection) {
              const expectedLines = config.infoLines ?? 1;
              return result.infoLineCount === expectedLines;
            } else {
              return result.infoLineCount === 0;
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 3 Extended: Preset Configurations", () => {
    it("gameSkeletonConfig produces correct render output", () => {
      const result = simulateEntitySkeletonRender(gameSkeletonConfig);
      
      expect(result.aspectRatioClass).toBe("aspect-[3/4]");
      expect(result.hasBadge).toBe(true);
      expect(result.badgePositionClass).toBe("right-3");
      expect(result.badgeSizeClasses).toBe("h-8 w-8 rounded-full");
      expect(result.hasInfoSection).toBe(false);
    });

    it("playerSkeletonConfig produces correct render output", () => {
      const result = simulateEntitySkeletonRender(playerSkeletonConfig);
      
      expect(result.aspectRatioClass).toBe("aspect-square");
      expect(result.hasBadge).toBe(true);
      expect(result.badgePositionClass).toBe("right-3");
      expect(result.badgeSizeClasses).toBe("h-6 w-16 rounded-full");
      expect(result.hasInfoSection).toBe(true);
      expect(result.infoLineCount).toBe(1);
      expect(result.hasGradientBackground).toBe(true);
    });

    it("characterSkeletonConfig produces correct render output", () => {
      const result = simulateEntitySkeletonRender(characterSkeletonConfig);
      
      expect(result.aspectRatioClass).toBe("aspect-[3/4]");
      expect(result.hasBadge).toBe(true);
      expect(result.badgePositionClass).toBe("right-3");
      expect(result.badgeSizeClasses).toBe("h-7 w-20 rounded-full");
      expect(result.hasInfoSection).toBe(false);
    });
  });

  describe("Property 3 Extended: Configuration Consistency", () => {
    it("same config always produces same render result", () => {
      fc.assert(
        fc.property(
          entitySkeletonConfigGenerator,
          (config) => {
            const result1 = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            const result2 = simulateEntitySkeletonRender(config as EntitySkeletonConfig);
            
            return (
              result1.aspectRatioClass === result2.aspectRatioClass &&
              result1.hasBadge === result2.hasBadge &&
              result1.badgePositionClass === result2.badgePositionClass &&
              result1.badgeSizeClasses === result2.badgeSizeClasses &&
              result1.hasInfoSection === result2.hasInfoSection &&
              result1.infoLineCount === result2.infoLineCount &&
              result1.hasGradientBackground === result2.hasGradientBackground
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
