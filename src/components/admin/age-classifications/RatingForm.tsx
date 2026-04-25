"use client";

import { type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { RatingFormData } from "@/lib/validations/admin-rating-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { RatingFormFields } from "./RatingFormFields";
import { Icon } from "@iconify/react";

export interface RatingFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<RatingFormData>;
  onSubmit: (data: RatingFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

export function RatingForm({
  mode,
  form,
  onSubmit,
  isSubmitting,
  supportedLanguages,
}: RatingFormProps) {
  const t = useTranslations("admin.ageClassifications.ratings.form");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <RatingFormFields form={form} t={t} supportedLanguages={supportedLanguages} />
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
