"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminRatingFormSchema, type RatingFormData } from "@/lib/validations/admin-rating-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { routing } from "@/i18n/routing";

export interface UseRatingFormReturn {
  form: UseFormReturn<RatingFormData>;
  submitRating: (data: RatingFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  supportedLanguages: SupportedLanguage[];
}

export function useRatingForm(
  mode: "create" | "edit",
  ratingSystemId: string,
  ratingId?: string,
  initialData?: RatingFormData
): UseRatingFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use the site's global locales (fr, en) — same pattern as useGenreForm
  const supportedLanguages: SupportedLanguage[] = routing.locales.map((code) => ({
    code,
    name: code,
    native_name: code,
  }));

  const form = useForm<RatingFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(adminRatingFormSchema) as any,
    defaultValues: initialData ?? {
      code: "",
      display_name: "",
      minimum_age: 0,
      color_hex: "",
      icon_url: "",
      sort_order: 0,
      translations: [],
    },
  });

  const prevDataRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialData) return;
    const serialized = JSON.stringify(initialData);
    if (serialized !== prevDataRef.current) {
      prevDataRef.current = serialized;
      form.reset(initialData);
    }
  }, [initialData, form]);

  const submitRating = useCallback(
    async (data: RatingFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const baseUrl = `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/ratings`;
        const url = mode === "create" ? baseUrl : `${baseUrl}/${ratingId}`;
        const method = mode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: data.code,
            display_name: data.display_name,
            minimum_age: data.minimum_age,
            color_hex: data.color_hex || "",
            icon_url: data.icon_url || "",
            sort_order: data.sort_order,
            translations: data.translations ?? [],
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} rating`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} rating`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, ratingSystemId, ratingId]
  );

  return { form, submitRating, isSubmitting, submitError, supportedLanguages };
}
