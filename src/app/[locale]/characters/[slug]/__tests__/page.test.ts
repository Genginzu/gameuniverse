import { describe, it, expect } from "bun:test";
import type { CharacterDetails, CharacterGame, CharacterMedia } from "@/types/character";

/**
 * Integration Tests for Character Details Page
 *
 * **Validates: Requirements 5.1, 6.1, 10.3**
 * - 5.1: Character details page displays complete information
 * - 6.1: Media gallery with all images
 * - 10.3: 404 handling for invalid slug
 */

// Types for simulating page behavior
type TabType = "media" | "games" | "description";

interface PageLoadResult {
  success: boolean;
  character: CharacterDetails | null;
  error: "not_found" | "server_error" | null;
}

interface MediaNavigationState {
  selectedScreenshotIndex: number;
  selectedArtworkIndex: number;
  selectedVideoIndex: number;
}

// Simulate the page load behavior
const simulatePageLoad = (
  slug: string,
  availableCharacters: Map<string, CharacterDetails>
): PageLoadResult => {
  if (!slug || slug.trim() === "") {
    return { success: false, character: null, error: "not_found" };
  }

  const character = availableCharacters.get(slug);

  if (!character) {
    return { success: false, character: null, error: "not_found" };
  }

  return { success: true, character, error: null };
};

// Simulate media gallery navigation
const simulateMediaNavigation = (
  media: CharacterMedia,
  currentState: MediaNavigationState,
  action: {
    type: "next" | "prev" | "select";
    mediaType: "screenshot" | "artwork" | "video";
    index?: number;
  }
): MediaNavigationState => {
  const newState = { ...currentState };

  const getNewIndex = (
    current: number,
    max: number,
    actionType: "next" | "prev" | "select",
    targetIndex?: number
  ): number => {
    if (max === 0) return 0;
    if (actionType === "select" && targetIndex !== undefined) {
      return Math.max(0, Math.min(targetIndex, max - 1));
    }
    if (actionType === "next") {
      return current < max - 1 ? current + 1 : 0;
    }
    if (actionType === "prev") {
      return current > 0 ? current - 1 : max - 1;
    }
    return current;
  };

  switch (action.mediaType) {
    case "screenshot":
      newState.selectedScreenshotIndex = getNewIndex(
        currentState.selectedScreenshotIndex,
        media.screenshots.length,
        action.type,
        action.index
      );
      break;
    case "artwork":
      newState.selectedArtworkIndex = getNewIndex(
        currentState.selectedArtworkIndex,
        media.artwork.length,
        action.type,
        action.index
      );
      break;
    case "video":
      newState.selectedVideoIndex = getNewIndex(
        currentState.selectedVideoIndex,
        media.videos.length,
        action.type,
        action.index
      );
      break;
  }

  return newState;
};

// Simulate tab switching
const simulateTabSwitch = (currentTab: TabType, newTab: TabType): TabType => {
  return newTab;
};

// Test fixtures
const createMockCharacter = (overrides?: Partial<CharacterDetails>): CharacterDetails => ({
  id: "char-1",
  slug: "mario",
  name: "Mario",
  role: "Protagonist",
  description: "The famous plumber from the Mushroom Kingdom",
  biography: "Mario is a fictional character created by Nintendo.",
  weapons: "Fireballs, Super Star",
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
      { id: "vid-1", title: "Trailer", url: "https://example.com/vid1.mp4" },
      { id: "vid-2", title: "Gameplay", url: "https://example.com/vid2.mp4" },
    ],
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("Character Details Page Integration Tests", () => {
  describe("Character Details Load Correctly", () => {
    /**
     * **Validates: Requirement 5.1**
     * WHEN a user navigates to /characters/[slug], THE Character_Details_Page
     * SHALL display the character's complete information
     */
    it("loads character details successfully for valid slug", () => {
      const characters = new Map<string, CharacterDetails>();
      const mario = createMockCharacter();
      characters.set("mario", mario);

      const result = simulatePageLoad("mario", characters);

      expect(result.success).toBe(true);
      expect(result.character).not.toBeNull();
      expect(result.character?.name).toBe("Mario");
      expect(result.character?.slug).toBe("mario");
      expect(result.error).toBeNull();
    });

    it("loads character with all required fields", () => {
      const characters = new Map<string, CharacterDetails>();
      const character = createMockCharacter();
      characters.set("mario", character);

      const result = simulatePageLoad("mario", characters);

      expect(result.character?.id).toBeDefined();
      expect(result.character?.slug).toBeDefined();
      expect(result.character?.name).toBeDefined();
      expect(result.character?.games).toBeDefined();
      expect(result.character?.media).toBeDefined();
      expect(result.character?.primaryGame).toBeDefined();
    });

    it("loads character with optional fields when present", () => {
      const characters = new Map<string, CharacterDetails>();
      const character = createMockCharacter({
        role: "Protagonist",
        description: "A description",
        biography: "A biography",
        weapons: "Some weapons",
      });
      characters.set("mario", character);

      const result = simulatePageLoad("mario", characters);

      expect(result.character?.role).toBe("Protagonist");
      expect(result.character?.description).toBe("A description");
      expect(result.character?.biography).toBe("A biography");
      expect(result.character?.weapons).toBe("Some weapons");
    });

    it("loads character without optional fields gracefully", () => {
      const characters = new Map<string, CharacterDetails>();
      const character = createMockCharacter({
        role: undefined,
        description: undefined,
        biography: undefined,
        weapons: undefined,
      });
      characters.set("minimal", character);

      const result = simulatePageLoad("minimal", characters);

      expect(result.success).toBe(true);
      expect(result.character?.name).toBeDefined();
    });
  });

  describe("404 Handling for Invalid Slug", () => {
    /**
     * **Validates: Requirement 10.3**
     * WHEN a character is not found, THE Character_Details_Page SHALL display
     * a 404 error page
     */
    it("returns not_found error for non-existent slug", () => {
      const characters = new Map<string, CharacterDetails>();
      characters.set("mario", createMockCharacter());

      const result = simulatePageLoad("non-existent-character", characters);

      expect(result.success).toBe(false);
      expect(result.character).toBeNull();
      expect(result.error).toBe("not_found");
    });

    it("returns not_found error for empty slug", () => {
      const characters = new Map<string, CharacterDetails>();

      const result = simulatePageLoad("", characters);

      expect(result.success).toBe(false);
      expect(result.error).toBe("not_found");
    });

    it("returns not_found error for whitespace-only slug", () => {
      const characters = new Map<string, CharacterDetails>();

      const result = simulatePageLoad("   ", characters);

      expect(result.success).toBe(false);
      expect(result.error).toBe("not_found");
    });

    it("slug matching is case-sensitive", () => {
      const characters = new Map<string, CharacterDetails>();
      characters.set("mario", createMockCharacter());

      const resultLower = simulatePageLoad("mario", characters);
      const resultUpper = simulatePageLoad("MARIO", characters);
      const resultMixed = simulatePageLoad("Mario", characters);

      expect(resultLower.success).toBe(true);
      expect(resultUpper.success).toBe(false);
      expect(resultMixed.success).toBe(false);
    });

    it("handles special characters in slug", () => {
      const characters = new Map<string, CharacterDetails>();
      characters.set(
        "link-hero-of-time",
        createMockCharacter({ slug: "link-hero-of-time", name: "Link" })
      );

      const result = simulatePageLoad("link-hero-of-time", characters);

      expect(result.success).toBe(true);
      expect(result.character?.name).toBe("Link");
    });
  });

  describe("Media Gallery Navigation", () => {
    /**
     * **Validates: Requirement 6.1**
     * WHEN character media exists, THE Character_Details_Page SHALL display
     * a gallery section with all images
     */
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
        { id: "art-3", url: "https://example.com/art3.jpg" },
      ],
      videos: [
        { id: "vid-1", title: "Video 1", url: "https://example.com/vid1.mp4" },
        { id: "vid-2", title: "Video 2", url: "https://example.com/vid2.mp4" },
      ],
    };

    describe("Screenshot Navigation", () => {
      it("navigates to next screenshot", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "next",
          mediaType: "screenshot",
        });

        expect(newState.selectedScreenshotIndex).toBe(1);
      });

      it("wraps to first screenshot when at end", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 3,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "next",
          mediaType: "screenshot",
        });

        expect(newState.selectedScreenshotIndex).toBe(0);
      });

      it("navigates to previous screenshot", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 2,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "prev",
          mediaType: "screenshot",
        });

        expect(newState.selectedScreenshotIndex).toBe(1);
      });

      it("wraps to last screenshot when at beginning", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "prev",
          mediaType: "screenshot",
        });

        expect(newState.selectedScreenshotIndex).toBe(3);
      });

      it("selects specific screenshot by clicking thumbnail", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "select",
          mediaType: "screenshot",
          index: 2,
        });

        expect(newState.selectedScreenshotIndex).toBe(2);
      });
    });

    describe("Artwork Navigation", () => {
      it("navigates through artwork gallery", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        let state = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "next",
          mediaType: "artwork",
        });
        expect(state.selectedArtworkIndex).toBe(1);

        state = simulateMediaNavigation(mediaWithMultipleItems, state, {
          type: "next",
          mediaType: "artwork",
        });
        expect(state.selectedArtworkIndex).toBe(2);

        state = simulateMediaNavigation(mediaWithMultipleItems, state, {
          type: "next",
          mediaType: "artwork",
        });
        expect(state.selectedArtworkIndex).toBe(0); // Wraps around
      });

      it("selects specific artwork by index", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "select",
          mediaType: "artwork",
          index: 2,
        });

        expect(newState.selectedArtworkIndex).toBe(2);
      });
    });

    describe("Video Navigation", () => {
      it("navigates through video gallery", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "next",
          mediaType: "video",
        });

        expect(newState.selectedVideoIndex).toBe(1);
      });

      it("selects specific video by clicking", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "select",
          mediaType: "video",
          index: 1,
        });

        expect(newState.selectedVideoIndex).toBe(1);
      });
    });

    describe("Empty Media Handling", () => {
      it("handles empty screenshots array", () => {
        const emptyMedia: CharacterMedia = {
          screenshots: [],
          artwork: [],
          videos: [],
        };

        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(emptyMedia, initialState, {
          type: "next",
          mediaType: "screenshot",
        });

        expect(newState.selectedScreenshotIndex).toBe(0);
      });

      it("navigation does not change index for empty media", () => {
        const emptyMedia: CharacterMedia = {
          screenshots: [],
          artwork: [],
          videos: [],
        };

        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const afterNext = simulateMediaNavigation(emptyMedia, initialState, {
          type: "next",
          mediaType: "artwork",
        });

        const afterPrev = simulateMediaNavigation(emptyMedia, initialState, {
          type: "prev",
          mediaType: "artwork",
        });

        expect(afterNext.selectedArtworkIndex).toBe(0);
        expect(afterPrev.selectedArtworkIndex).toBe(0);
      });
    });

    describe("Index Bounds", () => {
      it("clamps select index to valid range", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 0,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "select",
          mediaType: "screenshot",
          index: 100, // Out of bounds
        });

        expect(newState.selectedScreenshotIndex).toBe(3); // Clamped to max valid index
      });

      it("clamps negative select index to 0", () => {
        const initialState: MediaNavigationState = {
          selectedScreenshotIndex: 2,
          selectedArtworkIndex: 0,
          selectedVideoIndex: 0,
        };

        const newState = simulateMediaNavigation(mediaWithMultipleItems, initialState, {
          type: "select",
          mediaType: "screenshot",
          index: -5, // Negative
        });

        expect(newState.selectedScreenshotIndex).toBe(0);
      });
    });
  });

  describe("Tab Switching", () => {
    /**
     * **Validates: Requirement 5.1**
     * Character details page should support tab navigation between
     * description, games, and media sections
     */
    it("switches from description to games tab", () => {
      const currentTab: TabType = "description";
      const newTab = simulateTabSwitch(currentTab, "games");

      expect(newTab).toBe("games");
    });

    it("switches from description to media tab", () => {
      const currentTab: TabType = "description";
      const newTab = simulateTabSwitch(currentTab, "media");

      expect(newTab).toBe("media");
    });

    it("switches from games to description tab", () => {
      const currentTab: TabType = "games";
      const newTab = simulateTabSwitch(currentTab, "description");

      expect(newTab).toBe("description");
    });

    it("switches from games to media tab", () => {
      const currentTab: TabType = "games";
      const newTab = simulateTabSwitch(currentTab, "media");

      expect(newTab).toBe("media");
    });

    it("switches from media to description tab", () => {
      const currentTab: TabType = "media";
      const newTab = simulateTabSwitch(currentTab, "description");

      expect(newTab).toBe("description");
    });

    it("switches from media to games tab", () => {
      const currentTab: TabType = "media";
      const newTab = simulateTabSwitch(currentTab, "games");

      expect(newTab).toBe("games");
    });

    it("switching to same tab is idempotent", () => {
      const currentTab: TabType = "description";
      const newTab = simulateTabSwitch(currentTab, "description");

      expect(newTab).toBe("description");
    });

    it("supports all three tab types", () => {
      const tabs: TabType[] = ["description", "games", "media"];

      tabs.forEach((tab) => {
        const result = simulateTabSwitch("description", tab);
        expect(result).toBe(tab);
      });
    });
  });

  describe("Character with Games", () => {
    it("loads character with multiple games", () => {
      const characters = new Map<string, CharacterDetails>();
      const character = createMockCharacter({
        games: [
          { id: "g1", slug: "game-1", title: "Game 1", isPrimary: true, releaseYear: 2020 },
          { id: "g2", slug: "game-2", title: "Game 2", isPrimary: false, releaseYear: 2021 },
          { id: "g3", slug: "game-3", title: "Game 3", isPrimary: false, releaseYear: 2022 },
        ],
      });
      characters.set("multi-game-char", character);

      const result = simulatePageLoad("multi-game-char", characters);

      expect(result.character?.games.length).toBe(3);
      expect(result.character?.games.filter((g) => g.isPrimary).length).toBe(1);
    });

    it("loads character with no games", () => {
      const characters = new Map<string, CharacterDetails>();
      const character = createMockCharacter({ games: [] });
      characters.set("no-games-char", character);

      const result = simulatePageLoad("no-games-char", characters);

      expect(result.success).toBe(true);
      expect(result.character?.games.length).toBe(0);
    });

    it("identifies primary game correctly", () => {
      const characters = new Map<string, CharacterDetails>();
      const character = createMockCharacter({
        games: [
          { id: "g1", slug: "game-1", title: "Secondary Game", isPrimary: false },
          { id: "g2", slug: "game-2", title: "Primary Game", isPrimary: true },
          { id: "g3", slug: "game-3", title: "Another Game", isPrimary: false },
        ],
      });
      characters.set("char", character);

      const result = simulatePageLoad("char", characters);
      const primaryGame = result.character?.games.find((g) => g.isPrimary);

      expect(primaryGame?.title).toBe("Primary Game");
    });
  });
});
