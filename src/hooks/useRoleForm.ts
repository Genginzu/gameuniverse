"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminRoleFormSchema, type RoleFormData } from "@/lib/validations/admin-role-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { routing } from "@/i18n/routing";

export interface UseRoleFormReturn {
  form: UseFormReturn<RoleFormData>;
  submitRole: (data: RoleFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  supportedLanguages: SupportedLanguage[];
}

export function useRoleForm(
  mode: "create" | "edit",
  initialData?: RoleFormData
): UseRoleFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const supportedLanguages: SupportedLanguage[] = routing.locales.map((code) => ({
    code,
    name: code,
    native_name: code,
  }));

  const form = useForm<RoleFormData>({
    resolver: zodResolver(adminRoleFormSchema),
    defaultValues: initialData ?? { slug: "", translations: [] },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const submitRole = useCallback(
    async (data: RoleFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const url = mode === "create" ? "/api/admin/roles" : `/api/admin/roles/${data.slug}`;
        const method = mode === "create" ? "POST" : "PUT";
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
          throw new Error(body.error || `Failed to ${mode} role`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} role`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode]
  );

  return { form, submitRole, isSubmitting, submitError, supportedLanguages };
}
