import { describe, it, expect } from "vitest";
import { toAchievementFormDefaults } from "../achievementFormDefaults";
import { adminAchievementFormSchema } from "@/lib/validations/admin-achievement-form";
import type { AdminAchievement } from "@/types/admin-achievements";

const EXISTING: AdminAchievement = {
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

describe("toAchievementFormDefaults", () => {
  it("returns empty create-mode defaults when no achievement is given", () => {
    expect(toAchievementFormDefaults()).toEqual({
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
    });
  });

  it("returns a fresh object on every call", () => {
    const first = toAchievementFormDefaults();
    first.key = "mutated";
    expect(toAchievementFormDefaults().key).toBe("");
  });

  it("maps every form field from an existing achievement and drops the id", () => {
    const { id: _id, ...expected } = EXISTING;
    expect(toAchievementFormDefaults(EXISTING)).toEqual(expected);
  });

  it("produces edit-mode defaults that satisfy the form schema", () => {
    expect(adminAchievementFormSchema.safeParse(toAchievementFormDefaults(EXISTING)).success).toBe(
      true
    );
  });
});
