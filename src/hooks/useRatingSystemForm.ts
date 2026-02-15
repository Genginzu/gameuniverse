"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminRatingSystemFormSchema,
  type RatingSystemFormData,
} from "@/lib/validations/admin-rating-system-form";

export interface UseRatingSystemFormReturn {
  form: UseFormReturn<RatingSystemFormData>;
  submitRatingSystem: (data: RatingSystemFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

export function useRatingSystemForm(
  mode: "create" | "edit",
  systemId?: string,
  initialData?: RatingSystemFormData
): UseRatingSystemFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RatingSystemFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(adminRatingSystemFormSchema) as any,
    defaultValues: initialData ?? {
      code: "",
      name: "",
      description: "",
      country_codes: [],
      website_url: "",
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

  const submitRatingSystem = useCallback(
    async (data: RatingSystemFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url =
          mode === "create"
            ? "/api/admin/age-classifications"
            : `/api/admin/age-classifications/${systemId}`;

        const method = mode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: data.code,
            name: data.name,
            description: data.description || "",
            country_codes: data.country_codes || [],
            website_url: data.website_url || "",
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} rating system`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} rating system`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, systemId]
  );

  return { form, submitRatingSystem, isSubmitting, submitError };
}
