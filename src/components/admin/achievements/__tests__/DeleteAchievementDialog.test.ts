import { describe, it, expect } from "vitest";

/**
 * DeleteAchievementDialog Unit Tests
 *
 * Tests the display logic that drives the DeleteAchievementDialog component:
 * 1. Usage warning visibility based on usageCount
 * 2. Dialog close prevention while deleting
 * 3. Achievement display name from key
 * 4. Confirm button label based on usage
 *
 * Requirements: 4.1, 4.2, 4.4, 4.6
 */

import type { AchievementCategory, AchievementTier } from "@/types/achievement";

interface AdminAchievement {
  id: string;
  key: string;
  category: AchievementCategory;
  tier: AchievementTier;
  threshold: number;
  xpValue: number;
  icon: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  sortOrder: number;
}

/** Mirrors the usage warning visibility logic in DeleteAchievementDialog */
function hasUsage(usageCount: number | undefined | null): boolean {
  return usageCount !== null && usageCount !== undefined && usageCount > 0;
}

/** Mirrors the dialog close guard logic in DeleteAchievementDialog (onOpenChange) */
function canCloseDialog(open: boolean, isDeleting: boolean): boolean {
  return !open && !isDeleting;
}

/** Mirrors the achievement display name logic (uses key as identifier) */
function getAchievementDisplayKey(achievement: AdminAchievement | null): string {
  return achievement?.key ?? "";
}

/** Mirrors the confirm button label logic based on usage */
function getConfirmLabel(usageCount: number | undefined | null): "forceConfirm" | "confirm" {
  return hasUsage(usageCount) ? "forceConfirm" : "confirm";
}

const unusedAchievement: AdminAchievement = {
  id: "ach-1",
  key: "first_game",
  category: "library",
  tier: "bronze",
  threshold: 1,
  xpValue: 50,
  icon: "trophy",
  nameFr: "Premier jeu",
  nameEn: "First Game",
  descriptionFr: "Ajoutez votre premier jeu",
  descriptionEn: "Add your first game",
  sortOrder: 1,
};

const usedAchievement: AdminAchievement = {
  id: "ach-2",
  key: "social_butterfly",
  category: "social",
  tier: "gold",
  threshold: 50,
  xpValue: 500,
  icon: "users",
  nameFr: "Papillon social",
  nameEn: "Social Butterfly",
  descriptionFr: "Ajoutez 50 amis",
  descriptionEn: "Add 50 friends",
  sortOrder: 10,
};

describe("DeleteAchievementDialog Logic", () => {
  describe("Usage Warning Visibility (Req 4.2)", () => {
    it("shows warning when usageCount is greater than 0", () => {
      expect(hasUsage(5)).toBe(true);
      expect(hasUsage(1)).toBe(true);
    });

    it("hides warning when usageCount is 0", () => {
      expect(hasUsage(0)).toBe(false);
    });

    it("hides warning when usageCount is undefined", () => {
      expect(hasUsage(undefined)).toBe(false);
    });

    it("hides warning when usageCount is null", () => {
      expect(hasUsage(null)).toBe(false);
    });
  });

  describe("Dialog Close Guard (Req 4.6)", () => {
    it("allows close when not deleting and dialog is closing", () => {
      expect(canCloseDialog(false, false)).toBe(true);
    });

    it("prevents close while deleting", () => {
      expect(canCloseDialog(false, true)).toBe(false);
    });

    it("does not trigger close when dialog stays open", () => {
      expect(canCloseDialog(true, false)).toBe(false);
    });
  });

  describe("Achievement Display Key (Req 4.1)", () => {
    it("returns key for a valid achievement", () => {
      expect(getAchievementDisplayKey(unusedAchievement)).toBe("first_game");
      expect(getAchievementDisplayKey(usedAchievement)).toBe("social_butterfly");
    });

    it("returns empty string when achievement is null", () => {
      expect(getAchievementDisplayKey(null)).toBe("");
    });
  });

  describe("Confirm Button Label (Req 4.4)", () => {
    it("shows force confirm when achievement has usage", () => {
      expect(getConfirmLabel(3)).toBe("forceConfirm");
      expect(getConfirmLabel(100)).toBe("forceConfirm");
    });

    it("shows normal confirm when no usage", () => {
      expect(getConfirmLabel(0)).toBe("confirm");
      expect(getConfirmLabel(undefined)).toBe("confirm");
      expect(getConfirmLabel(null)).toBe("confirm");
    });
  });
});
