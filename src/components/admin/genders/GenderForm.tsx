"use client";

import { type UseFormReturn } from "react-hook-form";
import type { GenderFormData } from "@/lib/validations/admin-gender-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { AdminSlugForm } from "@/components/admin/shared/AdminSlugForm";
import type { TranslationFieldConfig } from "@/components/admin/shared/AdminTranslationFields";

const TRANSLATION_FIELDS: TranslationFieldConfig[] = [
  { name: "name", type: "input", maxLength: 255 },
];

export interface GenderFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<GenderFormData>;
  onSubmit: (data: GenderFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

export function GenderForm(props: GenderFormProps) {
  return (
    <AdminSlugForm
      {...props}
      translationNamespace="admin.genders.form"
      translationFields={TRANSLATION_FIELDS}
    />
  );
}
