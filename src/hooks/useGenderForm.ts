"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminGenderFormSchema, type GenderFormData } from "@/lib/validations/admin-gender-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { routing } from "@/i18n/routing";

export interface UseGenderFormReturn {
  form: UseFormReturn<GenderFormData>;
  submitGender: (data: GenderFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  supportedLanguages: SupportedLanguage[];
}

export function useGenderForm(
  mode: "create" | "edit",
  initialData?: GenderFormData,
  genderId?: string
): UseGenderFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const supportedLanguages: SupportedLanguage[] = routing.locales.map((code) => ({
    code,
    name: code,
    native_name: code,
  }));

  const form = useForm<GenderFormData>({
    resolver: zodResolver(adminGenderFormSchema),
    defaultValues: initialData ?? {
      slug: "",
      translations: supportedLanguages.map((lang) => ({
        language_code: lang.code,
        name: "",
      })),
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const submitGender = useCallback(
    async (data: GenderFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url = mode === "create" ? "/api/admin/genders" : `/api/admin/genders/${genderId}`;
        const method = mode === "create" ? "POST" : "PUT";
        const payload = { slug: data.slug, translations: data.translations };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} gender`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} gender`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, genderId]
  );

  return { form, submitGender, isSubmitting, submitError, supportedLanguages };
}
