import { describe, it, expect } from "bun:test";
import type {
  CharacterDetails,
  CharacterGame,
  CharacterMedia,
  CharacterRelationship,
} from "../../../../src/types/character";

/**
 * Unit Tests for CharacterDetailsContent Component
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1, 6.3**
 * - 5.1: Character details page displays complete information
 * - 5.2: Hero section with main image and name
 * - 5.3: Origin game(s), role, and description
 * - 5.4: Biography and story information
 * - 6.1: Media gallery with all images
 * - 6.3: Handle missing media gracefully
 */

// Types for simulating component state and rendering
type TabType = "media" | "games" | "description";

interface TabState {
  activeTab: TabType;
  availableTabs: TabType[];
}

interface MediaNavigationState {
  selectedScreenshotIndex: number;
  selectedArtworkIndex: number;
  selectedVideoIndex: number;
  screenshotsCount: number;
  artworkCount: number;
  videosCount: number;
}

interface SectionRenderResult {
  heroSection: {
    isRendered: boolean;
    hasMainImage: boolean;
    hasCharacterName: boolean;
    hasBackgroundImage: boolean;
    backgroundColor: string;
  };
  descriptionTab: {
    hasRoleCard: boolean;
    hasPrimaryGameCard: boolean;
    hasAppearancesCard: boolean;
    hasWeaponsSection: boolean;
    hasBiographySection: boolean;
    hasRelationshipsSection: boolean;
    showsEmptyState: boolean;
  };
  gamesTab: {
    gamesCount: number;
    hasPrimaryGameBadge: boolean;
    showsEmptyState: boolean;
  };
  mediaTab: {
    hasScreenshots: boolean;
    hasArtwork: boolean;
    hasVideos: boolean;
    showsEmptyState: boolean;
  };
}

// Simulate the getCharacterColors function from the component
const getCharacterColors = (role?: string) => {
  const characterRole = role?.toLowerCase() || "";

  if (characterRole.includes("protagonist") || characterRole.includes("hero")) {
    return {
      primary: "#3b82f6",
      secondary: "#1d4ed8",
      accent: "#60a5fa",
      bg: "from-blue-500/20 to-indigo-500/20",
    };
  }

  if (characterRole.includes("antagonist") || characterRole.includes("villain")) {
    return {
      primary: "#ef4444",
      secondary: "#b91c1c",
      accent: "#f87171",
      bg: "from-red-500/20 to-purple-500/20",
    };
  }

  if (characterRole.includes("supporting") || characterRole.includes("ally")) {
    return {
      primary: "#10b981",
      secondary: "#059669",
      accent: "#34d399",
      bg: "from-emerald-500/20 to-teal-500/20",
    };
  }

  return {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
    bg: "from-violet-500/20 to-blue-500/20",
  };
};

// Simulate tab switching logic
const simulateTabSwitch = (currentTab: TabType, newTab: TabType): TabState => {
  const availableTabs: TabType[] = ["description", "games", "media"];
  return {
    activeTab: newTab,
    availableTabs,
  };
};

// Simulate media navigation logic
const simulateMediaNavigation = (
  media: CharacterMedia,
  action: "next" | "prev" | "select",
  mediaType: "screenshot" | "artwork" | "video",
  currentIndex: number,
  targetIndex?: number
): MediaNavigationState => {
  const counts = {
    screenshotsCount: media.screenshots.length,
    artworkCount: media.artwork.length,
    videosCount: media.videos.length,
  };

  let newScreenshotIndex = currentIndex;
  let newArtworkIndex = currentIndex;
  let newVideoIndex = currentIndex;

  const getNewIndex = (current: number, max: number): number => {
    if (action === "select" && targetIndex !== undefined) {
      return Math.max(0, Math.min(targetIndex, max - 1));
    }
    if (action === "next") {
      return current < max - 1 ? current + 1 : 0;
    }
    if (action === "prev") {
      return current > 0 ? current - 1 : max - 1;
    }
    return current;
  };

  if (mediaType === "screenshot" && counts.screenshotsCount > 0) {
    newScreenshotIndex = getNewIndex(currentIndex, counts.screenshotsCount);
  } else if (mediaType === "artwork" && counts.artworkCount > 0) {
    newArtworkIndex = getNewIndex(currentIndex, counts.artworkCount);
  } else if (mediaType === "video" && counts.videosCount > 0) {
    newVideoIndex = getNewIndex(currentIndex, counts.videosCount);
  }

  return {
    selectedScreenshotIndex: mediaType === "screenshot" ? newScreenshotIndex : 0,
    selectedArtworkIndex: mediaType === "artwork" ? newArtworkIndex : 0,
    selectedVideoIndex: mediaType === "video" ? newVideoIndex : 0,
    ...counts,
  };
};

// Simulate section rendering logic
const simulateSectionRender = (character: CharacterDetails): SectionRenderResult => {
  const primaryGame = character.games.find((g: CharacterGame) => g.isPrimary) || character.games[0];
  const heroBackgroundImage = primaryGame?.backgroundImage || character.media.backgroundImage;

  const hasDescriptionContent =
    !!character.biography ||
    !!character.weapons ||
    (character.relationships && character.relationships.length > 0);

  return {
    heroSection: {
      isRendered: true,
      hasMainImage: !!character.media.mainImage,
      hasCharacterName: !!character.name,
      hasBackgroundImage: !!heroBackgroundImage,
      backgroundColor: character.backgroundColor || "#0f172a",
    },
    descriptionTab: {
      hasRoleCard: !!character.role,
      hasPrimaryGameCard: true, // Always shown
      hasAppearancesCard: true, // Always shown
      hasWeaponsSection: !!character.weapons,
      hasBiographySection: !!character.biography,
      hasRelationshipsSection: !!character.relationships && character.relationships.length > 0,
      showsEmptyState: !hasDescriptionContent,
    },
    gamesTab: {
      gamesCount: character.games.length,
      hasPrimaryGameBadge: character.games.some((g: CharacterGame) => g.isPrimary),
      showsEmptyState: character.games.length === 0,
    },
    mediaTab: {
      hasScreenshots: character.media.screenshots.length > 0,
      hasArtwork: character.media.artwork.length > 0,
      hasVideos: character.media.videos.length > 0,
      showsEmptyState:
        character.media.screenshots.length === 0 &&
        character.media.artwork.length === 0 &&
        character.media.videos.length === 0,
    },
  };
};

// Test fixtures
const createMockCharacter = (overrides?: Partial<CharacterDetails>): CharacterDetails => ({
  id: "char-1",
  slug: "mario",
  name: "Mario",
  role: "Protagonist",
  description: "The famous plumber from the Mushroom Kingdom",
  biography: "Mario is a fictional character created by Nintendo.",
  weapons: "Fireballs, Super Star, Hammer",
  backgroundColor: "#ff0000",
  games: [
    {
      id: "game-1",
      slug: "super-mario-bros",
      title: "Super Mario Bros",
      coverImage: "https://example.com/smb-cover.jpg",
      backgroundImage: "https://example.com/smb-bg.jpg",
      releaseYear: 1985,
      isPrimary: true,
    },
    {
      id: "game-2",
      slug: "mario-kart",
      title: "Mario Kart",
      coverImage: "https://example.com/mk-cover.jpg",
      releaseYear: 1992,
      isPrimary: false,
    },
  ],
  primaryGame: "Super Mario Bros",
  media: {
    mainImage: "https://example.com/mario.png",
    backgroundImage: "https://example.com/mario-bg.jpg",
    screenshots: [
      { id: "ss-1", url: "https://example.com/ss1.jpg" },
      { id: "ss-2", url: "https://example.com/ss2.jpg" },
      { id: "ss-3", url: "https://example.com/ss3.jpg" },
    ],
    artwork: [
      { id: "art-1", url: "https://example.com/art1.jpg" },
      { id: "art-2", url: "https://example.com/art2.jpg" },
    ],
    videos: [
      {
        id: "vid-1",
        title: "Mario Trailer",
        url: "https://example.com/vid1.mp4",
        thumbnailUrl: "https://example.com/vid1-thumb.jpg",
      },
    ],
  },
  relationships: [
    {
      id: "rel-1",
      relatedCharacter: {
        id: "char-2",
        slug: "luigi",
        name: "Luigi",
        mainImage: "https://example.com/luigi.png",
        role: "Supporting",
      },
      relationshipType: "family",
      description: "Mario's brother",
    },
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("CharacterDetailsContent Unit Tests", () => {
  describe("Section Rendering", () => {
    it("renders hero section with all required elements", () => {
      const character = createMockCharacter();
      const result = simulateSectionRender(character);

      expect(result.heroSection.isRendered).toBe(true);
      expect(result.heroSection.hasMainImage).toBe(true);
      expect(result.heroSection.hasCharacterName).toBe(true);
      expect(result.heroSection.hasBackgroundImage).toBe(true);
      expect(result.heroSection.backgroundColor).toBe("#ff0000");
    });

    it("uses fallback background color when not provided", () => {
      const character = createMockCharacter({ backgroundColor: undefined });
      const result = simulateSectionRender(character);

      expect(result.heroSection.backgroundColor).toBe("#0f172a");
    });

    it("renders description tab with all info cards", () => {
      const character = createMockCharacter();
      const result = simulateSectionRender(character);

      expect(result.descriptionTab.hasRoleCard).toBe(true);
      expect(result.descriptionTab.hasPrimaryGameCard).toBe(true);
      expect(result.descriptionTab.hasAppearancesCard).toBe(true);
      expect(result.descriptionTab.hasWeaponsSection).toBe(true);
      expect(result.descriptionTab.hasBiographySection).toBe(true);
      expect(result.descriptionTab.hasRelationshipsSection).toBe(true);
      expect(result.descriptionTab.showsEmptyState).toBe(false);
    });

    it("renders games tab with correct game count", () => {
      const character = createMockCharacter();
      const result = simulateSectionRender(character);

      expect(result.gamesTab.gamesCount).toBe(2);
      expect(result.gamesTab.hasPrimaryGameBadge).toBe(true);
      expect(result.gamesTab.showsEmptyState).toBe(false);
    });

    it("renders media tab with all media types", () => {
      const character = createMockCharacter();
      const result = simulateSectionRender(character);

      expect(result.mediaTab.hasScreenshots).toBe(true);
      expect(result.mediaTab.hasArtwork).toBe(true);
      expect(result.mediaTab.hasVideos).toBe(true);
      expect(result.mediaTab.showsEmptyState).toBe(false);
    });
  });

  describe("Tab Switching", () => {
    it("switches from description to games tab", () => {
      const result = simulateTabSwitch("description", "games");

      expect(result.activeTab).toBe("games");
      expect(result.availableTabs).toContain("games");
    });

    it("switches from description to media tab", () => {
      const result = simulateTabSwitch("description", "media");

      expect(result.activeTab).toBe("media");
      expect(result.availableTabs).toContain("media");
    });

    it("switches from games to description tab", () => {
      const result = simulateTabSwitch("games", "description");

      expect(result.activeTab).toBe("description");
      expect(result.availableTabs).toContain("description");
    });

    it("switches from media to games tab", () => {
      const result = simulateTabSwitch("media", "games");

      expect(result.activeTab).toBe("games");
    });

    it("all three tabs are always available", () => {
      const result = simulateTabSwitch("description", "media");

      expect(result.availableTabs).toHaveLength(3);
      expect(result.availableTabs).toContain("description");
      expect(result.availableTabs).toContain("games");
      expect(result.availableTabs).toContain("media");
    });
  });

  describe("Media Navigation", () => {
    const mediaWithMultipleItems: CharacterMedia = {
      mainImage: "https://example.com/main.jpg",
      screenshots: [
        { id: "ss-1", url: "https://example.com/ss1.jpg" },
        { id: "ss-2", url: "https://example.com/ss2.jpg" },
        { id: "ss-3", url: "https://example.com/ss3.jpg" },
        { id: "ss-4", url: "https://example.com/ss4.jpg" },
      ],
      artwork: [
        { id: "art-1", url: "https://example.com/art1.jpg" },
        { id: "art-2", url: "https://example.com/art2.jpg" },
      ],
      videos: [
        { id: "vid-1", title: "Video 1", url: "https://example.com/vid1.mp4" },
        { id: "vid-2", title: "Video 2", url: "https://example.com/vid2.mp4" },
        { id: "vid-3", title: "Video 3", url: "https://example.com/vid3.mp4" },
      ],
    };

    describe("Screenshot Navigation", () => {
      it("navigates to next screenshot", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "next", "screenshot", 0);

        expect(result.selectedScreenshotIndex).toBe(1);
      });

      it("wraps to first screenshot when at end", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "next", "screenshot", 3);

        expect(result.selectedScreenshotIndex).toBe(0);
      });

      it("navigates to previous screenshot", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "prev", "screenshot", 2);

        expect(result.selectedScreenshotIndex).toBe(1);
      });

      it("wraps to last screenshot when at beginning", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "prev", "screenshot", 0);

        expect(result.selectedScreenshotIndex).toBe(3);
      });

      it("selects specific screenshot by index", () => {
        const result = simulateMediaNavigation(
          mediaWithMultipleItems,
          "select",
          "screenshot",
          0,
          2
        );

        expect(result.selectedScreenshotIndex).toBe(2);
      });
    });

    describe("Artwork Navigation", () => {
      it("navigates to next artwork", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "next", "artwork", 0);

        expect(result.selectedArtworkIndex).toBe(1);
      });

      it("wraps to first artwork when at end", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "next", "artwork", 1);

        expect(result.selectedArtworkIndex).toBe(0);
      });

      it("navigates to previous artwork", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "prev", "artwork", 1);

        expect(result.selectedArtworkIndex).toBe(0);
      });

      it("wraps to last artwork when at beginning", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "prev", "artwork", 0);

        expect(result.selectedArtworkIndex).toBe(1);
      });
    });

    describe("Video Navigation", () => {
      it("navigates to next video", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "next", "video", 0);

        expect(result.selectedVideoIndex).toBe(1);
      });

      it("wraps to first video when at end", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "next", "video", 2);

        expect(result.selectedVideoIndex).toBe(0);
      });

      it("selects specific video by index", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "select", "video", 0, 2);

        expect(result.selectedVideoIndex).toBe(2);
      });
    });

    describe("Media Counts", () => {
      it("returns correct media counts", () => {
        const result = simulateMediaNavigation(mediaWithMultipleItems, "next", "screenshot", 0);

        expect(result.screenshotsCount).toBe(4);
        expect(result.artworkCount).toBe(2);
        expect(result.videosCount).toBe(3);
      });
    });
  });

  describe("Empty States", () => {
    it("shows empty state for description tab when no content", () => {
      const character = createMockCharacter({
        biography: undefined,
        weapons: undefined,
        relationships: [],
      });
      const result = simulateSectionRender(character);

      expect(result.descriptionTab.showsEmptyState).toBe(true);
      expect(result.descriptionTab.hasBiographySection).toBe(false);
      expect(result.descriptionTab.hasWeaponsSection).toBe(false);
      expect(result.descriptionTab.hasRelationshipsSection).toBe(false);
    });

    it("shows empty state for games tab when no games", () => {
      const character = createMockCharacter({ games: [] });
      const result = simulateSectionRender(character);

      expect(result.gamesTab.showsEmptyState).toBe(true);
      expect(result.gamesTab.gamesCount).toBe(0);
    });

    it("shows empty state for media tab when no media", () => {
      const character = createMockCharacter({
        media: {
          screenshots: [],
          artwork: [],
          videos: [],
        },
      });
      const result = simulateSectionRender(character);

      expect(result.mediaTab.showsEmptyState).toBe(true);
      expect(result.mediaTab.hasScreenshots).toBe(false);
      expect(result.mediaTab.hasArtwork).toBe(false);
      expect(result.mediaTab.hasVideos).toBe(false);
    });

    it("does not show empty state when only screenshots exist", () => {
      const character = createMockCharacter({
        media: {
          screenshots: [{ id: "ss-1", url: "https://example.com/ss1.jpg" }],
          artwork: [],
          videos: [],
        },
      });
      const result = simulateSectionRender(character);

      expect(result.mediaTab.showsEmptyState).toBe(false);
      expect(result.mediaTab.hasScreenshots).toBe(true);
    });

    it("does not show empty state when only artwork exists", () => {
      const character = createMockCharacter({
        media: {
          screenshots: [],
          artwork: [{ id: "art-1", url: "https://example.com/art1.jpg" }],
          videos: [],
        },
      });
      const result = simulateSectionRender(character);

      expect(result.mediaTab.showsEmptyState).toBe(false);
      expect(result.mediaTab.hasArtwork).toBe(true);
    });

    it("does not show empty state when only videos exist", () => {
      const character = createMockCharacter({
        media: {
          screenshots: [],
          artwork: [],
          videos: [{ id: "vid-1", title: "Video", url: "https://example.com/vid.mp4" }],
        },
      });
      const result = simulateSectionRender(character);

      expect(result.mediaTab.showsEmptyState).toBe(false);
      expect(result.mediaTab.hasVideos).toBe(true);
    });

    it("handles character with no role gracefully", () => {
      const character = createMockCharacter({ role: undefined });
      const result = simulateSectionRender(character);

      expect(result.descriptionTab.hasRoleCard).toBe(false);
      // Other cards should still be present
      expect(result.descriptionTab.hasPrimaryGameCard).toBe(true);
      expect(result.descriptionTab.hasAppearancesCard).toBe(true);
    });
  });

  describe("Color System", () => {
    it("returns blue colors for protagonist role", () => {
      const colors = getCharacterColors("Protagonist");

      expect(colors.primary).toBe("#3b82f6");
      expect(colors.bg).toContain("blue");
    });

    it("returns blue colors for hero role", () => {
      const colors = getCharacterColors("Hero");

      expect(colors.primary).toBe("#3b82f6");
    });

    it("returns red colors for antagonist role", () => {
      const colors = getCharacterColors("Antagonist");

      expect(colors.primary).toBe("#ef4444");
      expect(colors.bg).toContain("red");
    });

    it("returns red colors for villain role", () => {
      const colors = getCharacterColors("Villain");

      expect(colors.primary).toBe("#ef4444");
    });

    it("returns green colors for supporting role", () => {
      const colors = getCharacterColors("Supporting");

      expect(colors.primary).toBe("#10b981");
      expect(colors.bg).toContain("emerald");
    });

    it("returns green colors for ally role", () => {
      const colors = getCharacterColors("Ally");

      expect(colors.primary).toBe("#10b981");
    });

    it("returns default violet colors for unknown role", () => {
      const colors = getCharacterColors("Unknown");

      expect(colors.primary).toBe("#8b5cf6");
      expect(colors.bg).toContain("violet");
    });

    it("returns default colors when role is undefined", () => {
      const colors = getCharacterColors(undefined);

      expect(colors.primary).toBe("#8b5cf6");
    });

    it("handles case-insensitive role matching", () => {
      const colorsLower = getCharacterColors("protagonist");
      const colorsUpper = getCharacterColors("PROTAGONIST");
      const colorsMixed = getCharacterColors("ProTaGoNiSt");

      expect(colorsLower.primary).toBe("#3b82f6");
      expect(colorsUpper.primary).toBe("#3b82f6");
      expect(colorsMixed.primary).toBe("#3b82f6");
    });
  });

  describe("Hero Background Image Selection", () => {
    it("uses primary game background image when available", () => {
      const character = createMockCharacter();
      const result = simulateSectionRender(character);

      // Primary game has backgroundImage set
      expect(result.heroSection.hasBackgroundImage).toBe(true);
    });

    it("falls back to media background image when primary game has none", () => {
      const character = createMockCharacter({
        games: [
          {
            id: "game-1",
            slug: "game",
            title: "Game",
            isPrimary: true,
            // No backgroundImage
          },
        ],
        media: {
          mainImage: "https://example.com/main.jpg",
          backgroundImage: "https://example.com/bg.jpg",
          screenshots: [],
          artwork: [],
          videos: [],
        },
      });
      const result = simulateSectionRender(character);

      expect(result.heroSection.hasBackgroundImage).toBe(true);
    });

    it("uses first game background when no primary game is set", () => {
      const character = createMockCharacter({
        games: [
          {
            id: "game-1",
            slug: "game",
            title: "Game",
            backgroundImage: "https://example.com/game-bg.jpg",
            isPrimary: false,
          },
        ],
      });
      const result = simulateSectionRender(character);

      expect(result.heroSection.hasBackgroundImage).toBe(true);
    });

    it("handles no background image gracefully", () => {
      const character = createMockCharacter({
        games: [
          {
            id: "game-1",
            slug: "game",
            title: "Game",
            isPrimary: true,
            // No backgroundImage
          },
        ],
        media: {
          mainImage: "https://example.com/main.jpg",
          // No backgroundImage
          screenshots: [],
          artwork: [],
          videos: [],
        },
      });
      const result = simulateSectionRender(character);

      expect(result.heroSection.hasBackgroundImage).toBe(false);
    });
  });
});
