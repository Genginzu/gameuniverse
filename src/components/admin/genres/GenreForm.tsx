"use client";

import { type UseFormReturn } from "react-hook-form";
import type { GenreFormData } from "@/lib/validations/admin-genre-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { AdminSlugForm } from "@/components/admin/shared/AdminSlugForm";
import type { TranslationFieldConfig } from "@/components/admin/shared/AdminTranslationFields";

const TRANSLATION_FIELDS: TranslationFieldConfig[] = [
  { name: "name", type: "input", maxLength: 100 },
  { name: "description", type: "textarea", maxLength: 500, rows: 3 },
];

export interface GenreFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<GenreFormData>;
  onSubmit: (data: GenreFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

export function GenreForm(props: GenreFormProps) {
  return (
    <AdminSlugForm
      {...props}
      translationNamespace="admin.genres.form"
      translationFields={TRANSLATION_FIELDS}
    />
  );
}
