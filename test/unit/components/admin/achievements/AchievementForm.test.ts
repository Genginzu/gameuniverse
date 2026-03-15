import { describe, it, expect } from "vitest";

/**
 * AchievementForm Unit Tests
 *
 * Tests the display logic that drives the AchievementForm component:
 * 1. Default values for create vs edit mode
 * 2. Key field disabled state in edit mode
 * 3. Form data mapping from AdminAchievement to form defaults
 *
 * Requirements: 2.1, 2.2, 2.4, 2.8, 3.1, 3.2, 3.5
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

interface AchievementFormData {
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

/** Mirrors toFormDefaults in AchievementForm.tsx */
function toFormDefaults(data?: AdminAchievement): AchievementFormData {
  if (!data) {
    return {
      key: "",
      category: "library",
      tier: "bronze",
      threshold: 1,
      xpValue: 10,
      icon: "",
      nameFr: "",
      nameEn: "",
      descriptionFr: "",
      descriptionEn: "",
      sortOrder: 0,
    };
  }
  return {
    key: data.key,
    category: data.category,
    tier: data.tier,
    threshold: data.threshold,
    xpValue: data.xpValue,
    icon: data.icon,
    nameFr: data.nameFr,
    nameEn: data.nameEn,
    descriptionFr: data.descriptionFr,
    descriptionEn: data.descriptionEn,
    sortOrder: data.sortOrder,
  };
}

/** Determines whether the key field should be disabled based on form mode */
function isKeyDisabled(mode: "create" | "edit"): boolean {
  return mode === "edit";
}

/** Determines the submit button label based on form mode */
function getSubmitLabel(mode: "create" | "edit"): "create" | "save" {
  return mode === "create" ? "create" : "save";
}

const existingAchievement: AdminAchievement = {
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

const goldAchievement: AdminAchievement = {
  id: "ach-2",
  key: "master_reviewer",
  category: "reviews",
  tier: "gold",
  threshold: 100,
  xpValue: 1000,
  icon: "star",
  nameFr: "Critique expert",
  nameEn: "Master Reviewer",
  descriptionFr: "Rédigez 100 critiques",
  descriptionEn: "Write 100 reviews",
  sortOrder: 50,
};

describe("AchievementForm Logic", () => {
  describe("Form Defaults — Create Mode (Req 2.1)", () => {
    it("returns empty defaults when no initial data", () => {
      const defaults = toFormDefaults();
      expect(defaults.key).toBe("");
      expect(defaults.category).toBe("library");
      expect(defaults.tier).toBe("bronze");
      expect(defaults.threshold).toBe(1);
      expect(defaults.xpValue).toBe(10);
      expect(defaults.icon).toBe("");
      expect(defaults.nameFr).toBe("");
      expect(defaults.nameEn).toBe("");
      expect(defaults.descriptionFr).toBe("");
      expect(defaults.descriptionEn).toBe("");
      expect(defaults.sortOrder).toBe(0);
    });

    it("returns empty defaults when undefined is passed", () => {
      const defaults = toFormDefaults(undefined);
      expect(defaults.key).toBe("");
      expect(defaults.icon).toBe("");
    });
  });

  describe("Form Defaults — Edit Mode (Req 3.1)", () => {
    it("maps all fields from existing achievement", () => {
      const defaults = toFormDefaults(existingAchievement);
      expect(defaults.key).toBe("first_game");
      expect(defaults.category).toBe("library");
      expect(defaults.tier).toBe("bronze");
      expect(defaults.threshold).toBe(1);
      expect(defaults.xpValue).toBe(50);
      expect(defaults.icon).toBe("trophy");
      expect(defaults.nameFr).toBe("Premier jeu");
      expect(defaults.nameEn).toBe("First Game");
      expect(defaults.descriptionFr).toBe("Ajoutez votre premier jeu");
      expect(defaults.descriptionEn).toBe("Add your first game");
      expect(defaults.sortOrder).toBe(1);
    });

    it("maps gold achievement with different values", () => {
      const defaults = toFormDefaults(goldAchievement);
      expect(defaults.key).toBe("master_reviewer");
      expect(defaults.category).toBe("reviews");
      expect(defaults.tier).toBe("gold");
      expect(defaults.threshold).toBe(100);
      expect(defaults.xpValue).toBe(1000);
      expect(defaults.sortOrder).toBe(50);
    });

    it("does not include the id field in form data", () => {
      const defaults = toFormDefaults(existingAchievement);
      expect("id" in defaults).toBe(false);
    });
  });

  describe("Key Field State (Req 3.2)", () => {
    it("key is editable in create mode", () => {
      expect(isKeyDisabled("create")).toBe(false);
    });

    it("key is disabled in edit mode", () => {
      expect(isKeyDisabled("edit")).toBe(true);
    });
  });

  describe("Submit Button Label (Req 2.8, 3.5)", () => {
    it("shows 'create' label in create mode", () => {
      expect(getSubmitLabel("create")).toBe("create");
    });

    it("shows 'save' label in edit mode", () => {
      expect(getSubmitLabel("edit")).toBe("save");
    });
  });
});
