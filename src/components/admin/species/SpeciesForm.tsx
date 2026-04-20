"use client";

import { type UseFormReturn } from "react-hook-form";
import type { SpeciesFormData } from "@/lib/validations/admin-species-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { AdminSlugForm } from "@/components/admin/shared/AdminSlugForm";
import type { TranslationFieldConfig } from "@/components/admin/shared/AdminTranslationFields";

const TRANSLATION_FIELDS: TranslationFieldConfig[] = [
  { name: "name", type: "input", maxLength: 255 },
];

export interface SpeciesFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<SpeciesFormData>;
  onSubmit: (data: SpeciesFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

export function SpeciesForm(props: SpeciesFormProps) {
  return (
    <AdminSlugForm
      {...props}
      translationNamespace="admin.species.form"
      translationFields={TRANSLATION_FIELDS}
    />
  );
}
