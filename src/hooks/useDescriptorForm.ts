"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminDescriptorFormSchema,
  type DescriptorFormData,
} from "@/lib/validations/admin-descriptor-form";

export interface UseDescriptorFormReturn {
  form: UseFormReturn<DescriptorFormData>;
  submitDescriptor: (data: DescriptorFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

export function useDescriptorForm(
  mode: "create" | "edit",
  ratingSystemId: string,
  descriptorId?: string,
  initialData?: DescriptorFormData
): UseDescriptorFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<DescriptorFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(adminDescriptorFormSchema) as any,
    defaultValues: initialData ?? {
      code: "",
      icon_url: "",
      translations: [{ language_code: "", name: "", description: "" }],
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

  const submitDescriptor = useCallback(
    async (data: DescriptorFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const baseUrl = `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/descriptors`;
        const url = mode === "create" ? baseUrl : `${baseUrl}/${descriptorId}`;
        const method = mode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: data.code,
            icon_url: data.icon_url || "",
            translations: data.translations.map((t) => ({
              language_code: t.language_code,
              name: t.name,
              description: t.description || "",
            })),
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} descriptor`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} descriptor`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, ratingSystemId, descriptorId]
  );

  return { form, submitDescriptor, isSubmitting, submitError };
}
