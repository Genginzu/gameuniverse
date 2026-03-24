import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterFormSyncTab } from "../../../../../src/components/admin/characters/CharacterFormSyncTab";

// Mock useCharacterSync hook
const mockSyncField = vi.fn().mockResolvedValue(true);
const mockSyncAll = vi.fn().mockResolvedValue(true);

vi.mock("../../../../../src/hooks/useCharacterSync", () => ({
  useCharacterSync: vi.fn(() => ({
    overrides: [],
    loadingOverrides: false,
    syncingField: null,
    syncField: mockSyncField,
    syncAll: mockSyncAll,
    error: null,
    refreshOverrides: vi.fn(),
  })),
}));

// Import after mock so we can change return values per test
import { useCharacterSync } from "../../../../../src/hooks/useCharacterSync";
const mockUseCharacterSync = vi.mocked(useCharacterSync);

describe("CharacterFormSyncTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCharacterSync.mockReturnValue({
      overrides: [],
      loadingOverrides: false,
      syncingField: null,
      syncField: mockSyncField,
      syncAll: mockSyncAll,
      error: null,
      refreshOverrides: vi.fn(),
    });
  });

  it("renders no-igdb message when igdbId is null", () => {
    render(<CharacterFormSyncTab characterId="char-1" igdbId={null} />);
    // The noIgdbLink key is returned as-is by the mock useTranslations
    expect(screen.getByText("noIgdbLink")).toBeInTheDocument();
  });

  it("renders field list when igdbId is present", () => {
    render(<CharacterFormSyncTab characterId="char-1" igdbId={12345} />);
    expect(screen.getByText("IGDB #12345")).toBeInTheDocument();
    // Should render 5 fields (translations, mainImage, gender, species, games)
    // Each field has a "syncField" button text
    const syncButtons = screen.getAllByText("syncField");
    expect(syncButtons.length).toBe(5);
  });

  it("shows synced status for fields without overrides", () => {
    render(<CharacterFormSyncTab characterId="char-1" igdbId={12345} />);
    const syncedBadges = screen.getAllByText("fieldSynced");
    expect(syncedBadges.length).toBe(5);
  });

  it("shows overridden status for fields with overrides", () => {
    mockUseCharacterSync.mockReturnValue({
      overrides: [
        {
          id: "o1",
          characterId: "char-1",
          fieldName: "gender",
          overriddenBy: "admin",
          overriddenAt: "2024-01-01",
        },
        {
          id: "o2",
          characterId: "char-1",
          fieldName: "species",
          overriddenBy: "admin",
          overriddenAt: "2024-01-01",
        },
      ],
      loadingOverrides: false,
      syncingField: null,
      syncField: mockSyncField,
      syncAll: mockSyncAll,
      error: null,
      refreshOverrides: vi.fn(),
    });

    render(<CharacterFormSyncTab characterId="char-1" igdbId={12345} />);
    const overriddenBadges = screen.getAllByText("fieldOverridden");
    expect(overriddenBadges.length).toBe(2);
    const syncedBadges = screen.getAllByText("fieldSynced");
    expect(syncedBadges.length).toBe(3);
  });

  it("calls syncAll when sync-all button is clicked", async () => {
    render(<CharacterFormSyncTab characterId="char-1" igdbId={12345} />);
    const syncAllButton = screen.getByText("syncAll");
    fireEvent.click(syncAllButton);
    expect(mockSyncAll).toHaveBeenCalledTimes(1);
  });

  it("displays error banner when error is present", () => {
    mockUseCharacterSync.mockReturnValue({
      overrides: [],
      loadingOverrides: false,
      syncingField: null,
      syncField: mockSyncField,
      syncAll: mockSyncAll,
      error: "Network error",
      refreshOverrides: vi.fn(),
    });

    render(<CharacterFormSyncTab characterId="char-1" igdbId={12345} />);
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });
});
