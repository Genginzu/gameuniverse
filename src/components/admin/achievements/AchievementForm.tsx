"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FaSave } from "react-icons/fa";
import {
  adminAchievementFormSchema,
  type AchievementFormData,
} from "@/lib/validations/admin-achievement-form";
import type { AdminAchievement } from "@/types/admin-achievements";
import { AchievementFormFields } from "./AchievementFormFields";

export interface AchievementFormProps {
  mode: "create" | "edit";
  initialData?: AdminAchievement;
  onSubmit: (data: AchievementFormData) => Promise<void>;
  isSubmitting: boolean;
}

/** Map AdminAchievement to form default values */
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

export function AchievementForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}: AchievementFormProps) {
  const t = useTranslations("adminAchievements.form");

  const form = useForm<AchievementFormData>({
    resolver: zodResolver(adminAchievementFormSchema),
    defaultValues: toFormDefaults(initialData),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <AchievementFormFields form={form} mode={mode} />

        {/* Submit button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px] gap-2">
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <FaSave className="h-4 w-4" />
                {mode === "create" ? t("create") : t("save")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
