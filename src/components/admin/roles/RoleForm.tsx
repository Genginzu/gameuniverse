"use client";

import { type UseFormReturn } from "react-hook-form";
import type { RoleFormData } from "@/lib/validations/admin-role-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { AdminSlugForm } from "@/components/admin/shared/AdminSlugForm";
import type { TranslationFieldConfig } from "@/components/admin/shared/AdminTranslationFields";

const TRANSLATION_FIELDS: TranslationFieldConfig[] = [
  { name: "name", type: "input", maxLength: 100 },
  { name: "description", type: "textarea", maxLength: 500, rows: 3 },
];

export interface RoleFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<RoleFormData>;
  onSubmit: (data: RoleFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

export function RoleForm(props: RoleFormProps) {
  return (
    <AdminSlugForm
      {...props}
      translationNamespace="admin.characterRoles.form"
      translationFields={TRANSLATION_FIELDS}
    />
  );
}
