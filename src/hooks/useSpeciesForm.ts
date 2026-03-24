"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminSpeciesFormSchema, type SpeciesFormData } from "@/lib/validations/admin-species-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { routing } from "@/i18n/routing";

export interface UseSpeciesFormReturn {
  form: UseFormReturn<SpeciesFormData>;
  submitSpecies: (data: SpeciesFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  supportedLanguages: SupportedLanguage[];
}

export function useSpeciesForm(
  mode: "create" | "edit",
  initialData?: SpeciesFormData,
  speciesId?: string
): UseSpeciesFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const supportedLanguages: SupportedLanguage[] = routing.locales.map((code) => ({
    code,
    name: code,
    native_name: code,
  }));

  const form = useForm<SpeciesFormData>({
    resolver: zodResolver(adminSpeciesFormSchema),
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

  const submitSpecies = useCallback(
    async (data: SpeciesFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url = mode === "create" ? "/api/admin/species" : `/api/admin/species/${speciesId}`;
        const method = mode === "create" ? "POST" : "PUT";
        const payload = { slug: data.slug, translations: data.translations };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} species`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} species`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, speciesId]
  );

  return { form, submitSpecies, isSubmitting, submitError, supportedLanguages };
}
