"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { adminGameFormSchema, type AdminGameFormData } from "@/lib/validations/admin-game-form";

export interface Genre {
  id: string;
  slug: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface UseGameFormReturn {
  form: UseFormReturn<AdminGameFormData>;
  genres: Genre[];
  companies: Company[];
  loadingOptions: boolean;
  submitGame: (data: AdminGameFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const DEFAULT_TRANSLATIONS = (locale: string): AdminGameFormData["translations"] => [
  { language_code: locale === "en" ? "en" : "fr", title: "", description: "" },
];

export function useGameForm(
  mode: "create" | "edit",
  initialData?: AdminGameFormData,
  gameId?: string
): UseGameFormReturn {
  const locale = useLocale();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AdminGameFormData>({
    resolver: zodResolver(adminGameFormSchema),
    defaultValues: initialData ?? {
      slug: "",
      translations: DEFAULT_TRANSLATIONS(locale),
      cover_image_url: "",
      release_date: "",
      genres: [],
      companies: [],
    },
  });

  // Load reference data (genres + companies)
  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const res = await fetch(
          `/api/admin/reference-data?locale=${locale}&include=genres,companies`
        );
        if (!res.ok) throw new Error("Failed to load reference data");

        const json = await res.json();
        if (!mounted) return;

        setGenres(
          (json.data?.genres ?? []).map((g: { id: string; slug: string; name: string }) => ({
            id: g.id,
            slug: g.slug,
            name: g.name,
          }))
        );
        setCompanies(
          (json.data?.companies ?? []).map((c: { id: string; name: string; slug: string }) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))
        );
      } catch {
        // Options will remain empty — form can still be used
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };

    loadOptions();
    return () => {
      mounted = false;
    };
  }, [locale]);

  // Reset form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const submitGame = useCallback(
    async (data: AdminGameFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url = mode === "create" ? "/api/admin/games" : `/api/admin/games/${gameId}`;

        const method = mode === "create" ? "POST" : "PUT";

        // Build the payload matching the API schema
        const payload =
          mode === "create"
            ? {
                game: {
                  slug: data.slug,
                  cover_image_url: data.cover_image_url || null,
                  release_date: data.release_date || null,
                },
                translations: data.translations.map((t) => ({
                  language_code: t.language_code,
                  title: t.title,
                  description: t.description || null,
                })),
                genres: data.genres,
                companies: data.companies,
              }
            : {
                game: {
                  slug: data.slug,
                  cover_image_url: data.cover_image_url || null,
                  release_date: data.release_date || null,
                },
                translations: data.translations.map((t) => ({
                  language_code: t.language_code,
                  title: t.title,
                  description: t.description || null,
                })),
                genres: data.genres,
                companies: data.companies,
              };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} game`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} game`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, gameId]
  );

  return {
    form,
    genres,
    companies,
    loadingOptions,
    submitGame,
    isSubmitting,
    submitError,
  };
}
