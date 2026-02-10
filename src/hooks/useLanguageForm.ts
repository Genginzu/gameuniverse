"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminLanguageFormSchema,
  type LanguageFormData,
} from "@/lib/validations/admin-language-form";

export interface UseLanguageFormReturn {
  form: UseFormReturn<LanguageFormData>;
  submitLanguage: (data: LanguageFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

export function useLanguageForm(
  mode: "create" | "edit",
  initialData?: LanguageFormData
): UseLanguageFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(adminLanguageFormSchema),
    defaultValues: initialData ?? {
      code: "",
      name: "",
      native_name: "",
    },
  });

  // Reset form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const submitLanguage = useCallback(
    async (data: LanguageFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url =
          mode === "create" ? "/api/admin/languages" : `/api/admin/languages/${data.code}`;

        const method = mode === "create" ? "POST" : "PUT";

        const payload =
          mode === "create"
            ? { code: data.code, name: data.name, native_name: data.native_name || "" }
            : { name: data.name, native_name: data.native_name || "" };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} language`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} language`;
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
    submitLanguage,
    isSubmitting,
    submitError,
  };
}
