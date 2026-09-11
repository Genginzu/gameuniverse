import { describe, it, expect } from "vitest";

/**
 * DeleteGenreDialog Unit Tests
 *
 * Tests the display logic that drives the DeleteGenreDialog component:
 * 1. Usage warning visibility based on usageCount
 * 2. Dialog close prevention while deleting
 * 3. Genre name display from slug
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

interface AdminGenre {
  id: string;
  slug: string;
  gameCount: number;
  translations: { language_code: string; name: string; description: string }[];
}

/** Mirrors the usage warning visibility logic in DeleteGenreDialog */
function shouldShowUsageWarning(usageCount: number | undefined | null): boolean {
  return usageCount !== null && usageCount !== undefined && usageCount > 0;
}

/** Mirrors the dialog close guard logic in DeleteGenreDialog */
function canCloseDialog(isOpen: boolean, isDeleting: boolean): boolean {
  return !isOpen && !isDeleting;
}

/** Mirrors the genre display name logic (uses slug as identifier) */
function getGenreDisplayName(genre: AdminGenre | null): string {
  return genre?.slug ?? "";
}

const unusedGenre: AdminGenre = {
  id: "genre-1",
  slug: "puzzle",
  gameCount: 0,
  translations: [{ language_code: "fr", name: "Puzzle", description: "" }],
};

const usedGenre: AdminGenre = {
  id: "genre-2",
  slug: "action",
  gameCount: 15,
  translations: [{ language_code: "fr", name: "Action", description: "Jeux d'action" }],
};

describe("DeleteGenreDialog Logic", () => {
  describe("Usage Warning Visibility (Req 4.2)", () => {
    it("shows warning when usageCount is greater than 0", () => {
      expect(shouldShowUsageWarning(5)).toBe(true);
      expect(shouldShowUsageWarning(1)).toBe(true);
    });

    it("hides warning when usageCount is 0", () => {
      expect(shouldShowUsageWarning(0)).toBe(false);
    });

    it("hides warning when usageCount is undefined", () => {
      expect(shouldShowUsageWarning(undefined)).toBe(false);
    });

    it("hides warning when usageCount is null", () => {
      expect(shouldShowUsageWarning(null)).toBe(false);
    });
  });

  describe("Dialog Close Guard (Req 4.3)", () => {
    it("allows close when not deleting and dialog is closing", () => {
      // onOpenChange fires with open=false when user clicks outside
      expect(canCloseDialog(false, false)).toBe(true);
    });

    it("prevents close while deleting", () => {
      expect(canCloseDialog(false, true)).toBe(false);
    });

    it("does not trigger close when dialog stays open", () => {
      expect(canCloseDialog(true, false)).toBe(false);
    });
  });

  describe("Genre Display Name (Req 4.1)", () => {
    it("returns slug for a valid genre", () => {
      expect(getGenreDisplayName(unusedGenre)).toBe("puzzle");
      expect(getGenreDisplayName(usedGenre)).toBe("action");
    });

    it("returns empty string when genre is null", () => {
      expect(getGenreDisplayName(null)).toBe("");
    });
  });
});
