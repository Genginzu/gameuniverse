"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import {
  adminAchievementFormSchema,
  type AchievementFormData,
} from "@/lib/validations/admin-achievement-form";
import type { AdminAchievement } from "@/types/admin-achievements";
import { toAchievementFormDefaults } from "@/lib/utils/achievementFormDefaults";
import { AchievementFormFields } from "./AchievementFormFields";
import { Icon } from "@iconify/react";

export interface AchievementFormProps {
  mode: "create" | "edit";
  initialData?: AdminAchievement;
  onSubmit: (data: AchievementFormData) => Promise<void>;
  isSubmitting: boolean;
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
    defaultValues: toAchievementFormDefaults(initialData),
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
                <Icon icon="fa:save" className="h-4 w-4" />
                {mode === "create" ? t("create") : t("save")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
