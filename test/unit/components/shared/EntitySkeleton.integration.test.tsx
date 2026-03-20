import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderToString } from "react-dom/server";

// Mock Skeleton component
vi.mock("../../../../src/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Import components after mocks
import {
  EntitySkeleton,
  gameSkeletonConfig,
  playerSkeletonConfig,
  characterSkeletonConfig,
  type EntitySkeletonConfig,
} from "../../../../src/components/shared/EntitySkeleton";

describe("EntitySkeleton integration tests", () => {
  describe("preset configurations", () => {
    it("should have correct gameSkeletonConfig", () => {
      expect(gameSkeletonConfig.aspectRatio).toBe("3:4");
      expect(gameSkeletonConfig.showBadge).toBe(true);
      expect(gameSkeletonConfig.badgePosition).toBe("top-right");
      expect(gameSkeletonConfig.badgeSize).toBe("small");
      expect(gameSkeletonConfig.showInfoSection).toBe(false);
    });

    it("should have correct playerSkeletonConfig", () => {
      expect(playerSkeletonConfig.aspectRatio).toBe("1:1");
      expect(playerSkeletonConfig.showBadge).toBe(true);
      expect(playerSkeletonConfig.badgePosition).toBe("top-right");
      expect(playerSkeletonConfig.badgeSize).toBe("medium");
      expect(playerSkeletonConfig.showInfoSection).toBe(true);
      expect(playerSkeletonConfig.infoLines).toBe(1);
      expect(playerSkeletonConfig.useGradientBackground).toBe(true);
    });

    it("should have correct characterSkeletonConfig", () => {
      expect(characterSkeletonConfig.aspectRatio).toBe("3:4");
      expect(characterSkeletonConfig.showBadge).toBe(true);
      expect(characterSkeletonConfig.badgePosition).toBe("top-right");
      expect(characterSkeletonConfig.badgeSize).toBe("large");
      expect(characterSkeletonConfig.showInfoSection).toBe(false);
    });
  });

  describe("standard card skeleton (games, characters)", () => {
    it("should render with 3:4 aspect ratio", () => {
      const html = renderToString(<EntitySkeleton config={gameSkeletonConfig} />);

      expect(html).toContain("aspect-3/4");
    });

    it("should render with 1:1 aspect ratio when configured", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "1:1",
        showBadge: false,
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      expect(html).toContain("aspect-square");
    });

    it("should render badge when showBadge is true", () => {
      const html = renderToString(<EntitySkeleton config={gameSkeletonConfig} />);

      expect(html).toContain("skeleton");
      expect(html).toContain("top-3");
    });

    it("should not render badge when showBadge is false", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "3:4",
        showBadge: false,
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      // Should have skeleton for image but not for badge
      const skeletonCount = (html.match(/skeleton/g) || []).length;
      expect(skeletonCount).toBe(1); // Only image skeleton
    });

    it("should position badge on top-left when configured", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "3:4",
        showBadge: true,
        badgePosition: "top-left",
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      expect(html).toContain("left-3");
    });

    it("should position badge on top-right when configured", () => {
      const html = renderToString(<EntitySkeleton config={gameSkeletonConfig} />);

      expect(html).toContain("right-3");
    });

    it("should apply small badge size", () => {
      const html = renderToString(<EntitySkeleton config={gameSkeletonConfig} />);

      expect(html).toContain("h-8 w-8 rounded-full");
    });

    it("should apply medium badge size", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "3:4",
        showBadge: true,
        badgeSize: "medium",
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      expect(html).toContain("h-6 w-16 rounded-full");
    });

    it("should apply large badge size", () => {
      const html = renderToString(<EntitySkeleton config={characterSkeletonConfig} />);

      expect(html).toContain("h-7 w-20 rounded-full");
    });

    it("should apply custom className", () => {
      const html = renderToString(
        <EntitySkeleton config={gameSkeletonConfig} className="custom-class" />
      );

      expect(html).toContain("custom-class");
    });
  });

  describe("player-style card with info section", () => {
    it("should render info section when showInfoSection is true", () => {
      const html = renderToString(<EntitySkeleton config={playerSkeletonConfig} />);

      expect(html).toContain("p-4"); // Info section padding
    });

    it("should render correct number of info lines", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "1:1",
        showInfoSection: true,
        infoLines: 3,
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      // Should have multiple skeleton lines in info section
      expect(html).toContain("h-5");
    });

    it("should apply gradient background when configured", () => {
      const html = renderToString(<EntitySkeleton config={playerSkeletonConfig} />);

      expect(html).toContain("bg-linear-to-br");
      expect(html).toContain("from-blue-100");
      expect(html).toContain("to-indigo-100");
    });

    it("should not apply gradient background when not configured", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "1:1",
        showInfoSection: true,
        useGradientBackground: false,
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      expect(html).not.toContain("bg-linear-to-br");
    });

    it("should render with rounded corners and shadow-sm", () => {
      const html = renderToString(<EntitySkeleton config={playerSkeletonConfig} />);

      expect(html).toContain("rounded-2xl");
      expect(html).toContain("shadow-md");
    });
  });

  describe("default badge size", () => {
    it("should use default badge size when not specified", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "3:4",
        showBadge: true,
        // badgeSize not specified
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      // Default is small (h-8 w-8 rounded-full)
      expect(html).toContain("h-8 w-8 rounded-full");
    });
  });

  describe("info section line widths", () => {
    it("should have first line wider than subsequent lines", () => {
      const config: EntitySkeletonConfig = {
        aspectRatio: "1:1",
        showInfoSection: true,
        infoLines: 2,
      };

      const html = renderToString(<EntitySkeleton config={config} />);

      expect(html).toContain("w-3/4"); // First line
      expect(html).toContain("w-1/2"); // Second line
    });
  });
});
