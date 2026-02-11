"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { adminGameFormSchema, type AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { AdminGenre, Company, Rating, ContentDescriptor } from "@/types/admin-games";
import type { SupportedLanguage } from "@/types/admin-languages";

export type { AdminGenre as Genre, Company, Rating, ContentDescriptor, SupportedLanguage };

export interface UseGameFormReturn {
  form: UseFormReturn<AdminGameFormData>;
  genres: AdminGenre[];
  companies: Company[];
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
  supportedLanguages: SupportedLanguage[];
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
  const [genres, setGenres] = useState<AdminGenre[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [contentDescriptors, setContentDescriptors] = useState<ContentDescriptor[]>([]);
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AdminGameFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(adminGameFormSchema) as any,
    defaultValues: initialData ?? {
      slug: "",
      translations: DEFAULT_TRANSLATIONS(locale),
      cover_image_url: "",
      background_image_url: "",
      release_date: "",
      metascore: "",
      playtime_hastily: "",
      playtime_normally: "",
      playtime_completely: "",
      screenshots: [],
      artwork: [],
      age_ratings: [],
      versions: [],
      languages: [],
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
          `/api/admin/reference-data?locale=${locale}&include=genres,companies,ratings,contentDescriptors,supportedLanguages`
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
        setRatings(json.data?.ratings ?? []);
        setContentDescriptors(json.data?.contentDescriptors ?? []);
        setSupportedLanguages(json.data?.supportedLanguages ?? []);
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

        // Filter out translations with empty titles before sending
        const validTranslations = data.translations
          .filter((t) => t.title && t.title.trim().length > 0)
          .map((t) => ({
            language_code: t.language_code,
            title: t.title!,
            description: t.description || null,
          }));

        // Build the payload matching the API schema
        const metascoreValue =
          data.metascore === "" || data.metascore === undefined || data.metascore === null
            ? null
            : Number(data.metascore);

        const toNum = (v: unknown) =>
          v === "" || v === undefined || v === null ? null : Number(v);

        const payload = {
          game: {
            slug: data.slug,
            cover_image_url: data.cover_image_url || null,
            background_image_url: data.background_image_url || null,
            release_date: data.release_date || null,
            metascore: metascoreValue,
            playtime_hastily: toNum(data.playtime_hastily),
            playtime_normally: toNum(data.playtime_normally),
            playtime_completely: toNum(data.playtime_completely),
          },
          translations: validTranslations,
          genres: data.genres,
          companies: data.companies,
          screenshots: data.screenshots
            .filter((s) => s.url.trim().length > 0)
            .map((s, i) => ({
              url: s.url,
              alt_text: s.alt_text || null,
              caption: s.caption || null,
              display_order: i,
              is_featured: s.is_featured,
            })),
          artwork: data.artwork
            .filter((a) => a.url.trim().length > 0)
            .map((a, i) => ({
              url: a.url,
              alt_text: a.alt_text || null,
              caption: a.caption || null,
              artwork_type: a.artwork_type || null,
              display_order: i,
              is_featured: a.is_featured,
            })),
          age_ratings: data.age_ratings,
          versions: data.versions
            .filter((v) => v.version_title.trim().length > 0)
            .map((v, i) => ({
              version_title: v.version_title,
              description: v.description || null,
              cover_image_url: v.cover_image_url || null,
              display_order: i,
            })),
          languages: data.languages
            .filter((l) => l.language_code.trim().length > 0 && l.language_name.trim().length > 0)
            .map((l) => ({
              language_code: l.language_code,
              language_name: l.language_name,
              has_audio: l.has_audio,
              has_subtitles: l.has_subtitles,
              has_interface: l.has_interface,
            })),
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
    ratings,
    contentDescriptors,
    supportedLanguages,
    loadingOptions,
    submitGame,
    isSubmitting,
    submitError,
  };
}
