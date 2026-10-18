import type { AchievementFormData } from "@/lib/validations/admin-achievement-form";
import type { AdminAchievement } from "@/types/admin-achievements";

const EMPTY_ACHIEVEMENT_FORM: AchievementFormData = {
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

/** Maps an AdminAchievement to AchievementForm default values (empty form when creating). */
export function toAchievementFormDefaults(data?: AdminAchievement): AchievementFormData {
  if (!data) return { ...EMPTY_ACHIEVEMENT_FORM };
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
