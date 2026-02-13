"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminCompanyFormSchema, type CompanyFormData } from "@/lib/validations/admin-company-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { routing } from "@/i18n/routing";

export interface UseCompanyFormReturn {
  form: UseFormReturn<CompanyFormData>;
  submitCompany: (data: CompanyFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  supportedLanguages: SupportedLanguage[];
}

export function useCompanyForm(
  mode: "create" | "edit",
  initialData?: CompanyFormData
): UseCompanyFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use the site's global locales (fr, en) — same pattern as useGenreForm
  const supportedLanguages: SupportedLanguage[] = routing.locales.map((code) => ({
    code,
    name: code,
    native_name: code,
  }));

  const form = useForm<CompanyFormData>({
    // z.preprocess infers input as `unknown`, causing a type mismatch with zodResolver.
    // The cast is safe because Zod handles the coercion at runtime.
    resolver: zodResolver(adminCompanyFormSchema) as Resolver<CompanyFormData>,
    defaultValues: initialData ?? {
      name: "",
      slug: "",
      company_type: "both",
      website_url: "",
      logo_url: "",
      founded_year: undefined,
      headquarters: "",
      translations: [],
    },
  });

  // Reset form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const submitCompany = useCallback(
    async (data: CompanyFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url =
          mode === "create" ? "/api/admin/companies" : `/api/admin/companies/${data.slug}`;

        const method = mode === "create" ? "POST" : "PUT";

        // In edit mode, slug is immutable — exclude it from the payload
        const { slug, ...editPayload } = data;
        const payload = mode === "create" ? data : editPayload;

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} company`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} company`;
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
    submitCompany,
    isSubmitting,
    submitError,
    supportedLanguages,
  };
}
