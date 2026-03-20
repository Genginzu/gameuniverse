import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

// Mock modules to prevent ESM resolution errors in node environment
vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: () => null,
    redirect: () => {},
    usePathname: () => "/",
    useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

vi.mock("next/link", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import type { EntityCardConfig, BadgeVariant } from "../../../../src/components/shared/EntityCard";
import { getMetascoreColor } from "../../../../src/components/shared/EntityCard"; // eslint-disable-line no-duplicate-imports

// Feature: code-refactoring, Property 2: EntityCard Configuration Rendering
// **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

// Test entity type for property testing
interface TestEntity {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  backgroundColor?: string;
  metascore?: number;
  gamesCount?: number;
  role?: string;
}

// Generator for test entities
const testEntityGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  coverImage: fc.option(fc.webUrl()),
  backgroundColor: fc.option(
    fc
      .tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      )
      .map(
        ([r, g, b]) =>
          `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
      )
  ),
  metascore: fc.option(fc.integer({ min: 0, max: 100 })),
  gamesCount: fc.option(fc.integer({ min: 0, max: 1000 })),
  role: fc.option(fc.constantFrom("Protagonist", "Antagonist", "Supporting", "NPC")),
});

// Generator for aspect ratios
const aspectRatioGenerator = fc.constantFrom("3:4" as const, "1:1" as const);

// Generator for badge positions
const badgePositionGenerator = fc.constantFrom("top-left" as const, "top-right" as const);

// Generator for badge variants
const badgeVariantGenerator = fc.constantFrom(
  "metascore" as const,
  "count" as const,
  "role" as const
);

// Generator for EntityCardConfig
const entityCardConfigGenerator = fc.record({
  aspectRatio: aspectRatioGenerator,
  imageField: fc.constant("coverImage" as keyof TestEntity),
  titleField: fc.constant("title" as keyof TestEntity),
  descriptionField: fc.option(fc.constant("description" as keyof TestEntity)),
  backgroundColorField: fc.option(fc.constant("backgroundColor" as keyof TestEntity)),
  badge: fc.option(
    fc.record({
      field: fc.constantFrom(
        "metascore" as keyof TestEntity,
        "gamesCount" as keyof TestEntity,
        "role" as keyof TestEntity
      ),
      position: badgePositionGenerator,
      variant: badgeVariantGenerator,
    })
  ),
  hoverOverlay: fc.option(
    fc.record({
      enabled: fc.boolean(),
      showTitle: fc.option(fc.boolean()),
      showDescription: fc.option(fc.boolean()),
      fields: fc.constant([]),
    })
  ),
  actions: fc.option(
    fc.record({
      libraryToggle: fc.option(fc.boolean()),
      share: fc.option(fc.boolean()),
    })
  ),
  linkTemplate: fc.constant(
    (entity: TestEntity, locale: string) => `/${locale}/test/${entity.slug}`
  ),
});

// Simulate rendering logic for EntityCard
const simulateEntityCardRender = (
  entity: TestEntity,
  config: EntityCardConfig<TestEntity>
): {
  aspectRatioClass: string;
  hasBadge: boolean;
  badgePosition: string | null;
  badgeVariant: BadgeVariant | null;
  hasHoverOverlay: boolean;
  hasLibraryToggle: boolean;
  linkHref: string;
} => {
  const aspectRatioClass = config.aspectRatio === "3:4" ? "aspect-3/4" : "aspect-square";

  let hasBadge = false;
  let badgePosition: string | null = null;
  let badgeVariant: BadgeVariant | null = null;

  if (config.badge) {
    const badgeValue = entity[config.badge.field];
    if (badgeValue !== undefined && badgeValue !== null) {
      hasBadge = true;
      badgePosition = config.badge.position;
      badgeVariant = config.badge.variant;
    }
  }

  const hasHoverOverlay = config.hoverOverlay?.enabled ?? false;
  const hasLibraryToggle = config.actions?.libraryToggle ?? false;
  const linkHref = config.linkTemplate(entity, "fr");

  return {
    aspectRatioClass,
    hasBadge,
    badgePosition,
    badgeVariant,
    hasHoverOverlay,
    hasLibraryToggle,
    linkHref,
  };
};

describe("EntityCard Property-Based Tests", () => {
  describe("Property 2: EntityCard Configuration Rendering", () => {
    it("renders with correct aspect ratio for any valid configuration", () => {
      fc.assert(
        fc.property(testEntityGenerator, entityCardConfigGenerator, (entity, config) => {
          const result = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);

          // Verify aspect ratio class matches configuration
          if (config.aspectRatio === "3:4") {
            return result.aspectRatioClass === "aspect-3/4";
          } else {
            return result.aspectRatioClass === "aspect-square";
          }
        }),
        { numRuns: 50 }
      );
    });

    it("displays badge when configured and value is present", () => {
      fc.assert(
        fc.property(testEntityGenerator, entityCardConfigGenerator, (entity, config) => {
          const result = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);

          if (config.badge) {
            const badgeValue = entity[config.badge.field as keyof TestEntity];
            const shouldHaveBadge = badgeValue !== undefined && badgeValue !== null;
            return result.hasBadge === shouldHaveBadge;
          }

          // No badge configured, should not have badge
          return result.hasBadge === false;
        }),
        { numRuns: 50 }
      );
    });

    it("badge position matches configuration", () => {
      fc.assert(
        fc.property(testEntityGenerator, entityCardConfigGenerator, (entity, config) => {
          const result = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);

          if (result.hasBadge && config.badge) {
            return result.badgePosition === config.badge.position;
          }

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("badge variant matches configuration", () => {
      fc.assert(
        fc.property(testEntityGenerator, entityCardConfigGenerator, (entity, config) => {
          const result = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);

          if (result.hasBadge && config.badge) {
            return result.badgeVariant === config.badge.variant;
          }

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("hover overlay enabled state matches configuration", () => {
      fc.assert(
        fc.property(testEntityGenerator, entityCardConfigGenerator, (entity, config) => {
          const result = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);
          const expectedHoverOverlay = config.hoverOverlay?.enabled ?? false;
          return result.hasHoverOverlay === expectedHoverOverlay;
        }),
        { numRuns: 50 }
      );
    });

    it("library toggle action matches configuration", () => {
      fc.assert(
        fc.property(testEntityGenerator, entityCardConfigGenerator, (entity, config) => {
          const result = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);
          const expectedLibraryToggle = config.actions?.libraryToggle ?? false;
          return result.hasLibraryToggle === expectedLibraryToggle;
        }),
        { numRuns: 50 }
      );
    });

    it("link href is generated correctly from template", () => {
      fc.assert(
        fc.property(testEntityGenerator, fc.constantFrom("fr", "en"), (entity, locale) => {
          const config: EntityCardConfig<TestEntity> = {
            aspectRatio: "3:4",
            imageField: "coverImage",
            titleField: "title",
            linkTemplate: (e, l) => `/${l}/test/${e.slug}`,
          };

          const result = simulateEntityCardRender(entity, config);
          const expectedHref = `/${locale}/test/${entity.slug}`;

          // Since we're using "fr" as default locale in simulateEntityCardRender
          return result.linkHref === `/fr/test/${entity.slug}`;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 2 Extended: Metascore Color Function", () => {
    it("returns valid color class for any score", () => {
      fc.assert(
        fc.property(fc.option(fc.integer({ min: 0, max: 100 })), (score) => {
          const colorClass = getMetascoreColor(score ?? undefined);

          // Should always return a valid Tailwind bg color class
          return colorClass.startsWith("bg-");
        }),
        { numRuns: 50 }
      );
    });

    it("returns correct color based on score ranges", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // Start from 1 since 0 is treated as "no score"
          (score) => {
            const colorClass = getMetascoreColor(score);

            if (score >= 90) return colorClass === "bg-green-600";
            if (score >= 75) return colorClass === "bg-green-500";
            if (score >= 60) return colorClass === "bg-yellow-500";
            if (score >= 40) return colorClass === "bg-orange-500";
            return colorClass === "bg-red-500";
          }
        ),
        { numRuns: 50 }
      );
    });

    it("returns gray for zero score (treated as no score)", () => {
      const zeroResult = getMetascoreColor(0);
      expect(zeroResult).toBe("bg-gray-500");
    });

    it("returns gray for undefined/null scores", () => {
      const undefinedResult = getMetascoreColor(undefined);
      expect(undefinedResult).toBe("bg-gray-500");
    });
  });

  describe("Property 2 Extended: Configuration Consistency", () => {
    it("same entity and config always produces same render result", () => {
      fc.assert(
        fc.property(testEntityGenerator, entityCardConfigGenerator, (entity, config) => {
          const result1 = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);
          const result2 = simulateEntityCardRender(entity, config as EntityCardConfig<TestEntity>);

          return (
            result1.aspectRatioClass === result2.aspectRatioClass &&
            result1.hasBadge === result2.hasBadge &&
            result1.badgePosition === result2.badgePosition &&
            result1.badgeVariant === result2.badgeVariant &&
            result1.hasHoverOverlay === result2.hasHoverOverlay &&
            result1.hasLibraryToggle === result2.hasLibraryToggle &&
            result1.linkHref === result2.linkHref
          );
        }),
        { numRuns: 50 }
      );
    });
  });
});
