"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminGenreFormSchema, type GenreFormData } from "@/lib/validations/admin-genre-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { routing } from "@/i18n/routing";

export interface UseGenreFormReturn {
  form: UseFormReturn<GenreFormData>;
  submitGenre: (data: GenreFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  supportedLanguages: SupportedLanguage[];
}

export function useGenreForm(
  mode: "create" | "edit",
  initialData?: GenreFormData
): UseGenreFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use the site's global locales (fr, en) instead of all DB languages
  const supportedLanguages: SupportedLanguage[] = routing.locales.map((code) => ({
    code,
    name: code,
    native_name: code,
  }));

  const form = useForm<GenreFormData>({
    resolver: zodResolver(adminGenreFormSchema),
    defaultValues: initialData ?? {
      slug: "",
      translations: [],
    },
  });

  // Reset form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const submitGenre = useCallback(
    async (data: GenreFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url = mode === "create" ? "/api/admin/genres" : `/api/admin/genres/${data.slug}`;

        const method = mode === "create" ? "POST" : "PUT";

        // In edit mode, slug is immutable — only send translations
        const payload =
          mode === "create"
            ? { slug: data.slug, translations: data.translations }
            : { translations: data.translations };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} genre`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} genre`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode]
  );

  return {
    form,
    submitGenre,
    isSubmitting,
    submitError,
    supportedLanguages,
  };
}
