"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { adminGameFormSchema, type AdminGameFormData } from "@/lib/validations/admin-game-form";
import { buildGamePayload } from "./useGameFormSubmit";
import type {
  AdminGenre,
  Company,
  Rating,
  ContentDescriptor,
  AdminStore,
  AdminCurrency,
} from "@/types/admin-games";
import type { SupportedLanguage } from "@/types/admin-languages";

export type {
  AdminGenre as Genre,
  Company,
  Rating,
  ContentDescriptor,
  SupportedLanguage,
  AdminStore,
  AdminCurrency,
};

export interface UseGameFormReturn {
  form: UseFormReturn<AdminGameFormData>;
  genres: AdminGenre[];
  companies: Company[];
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
  supportedLanguages: SupportedLanguage[];
  stores: AdminStore[];
  currencies: AdminCurrency[];
  platforms: string[];
  gamePlatforms: Array<{ id: string; slug: string; name: string }>;
  loadingOptions: boolean;
  submitGame: (data: AdminGameFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  refreshGamePlatforms: () => Promise<void>;
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
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [currencies, setCurrencies] = useState<AdminCurrency[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [gamePlatforms, setGamePlatforms] = useState<
    Array<{ id: string; slug: string; name: string }>
  >([]);
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
      background_color: "",
      accent_color: "",
      label_color: "",
      text_color: "",
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
      prices: [],
      genres: [],
      companies: [],
      music_composer: "",
      music_spotify_embed_url: "",
      music_youtube_video_url: "",
      game_platforms: [],
    },
    is_esport: false,
  });

  useEffect(() => {
    let mounted = true;
    const loadOptions = async () => {
      try {
        const res = await fetch(
          `/api/admin/reference-data?locale=${locale}&include=genres,companies,ratings,contentDescriptors,supportedLanguages,stores,currencies,platforms,gamePlatforms`
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
        setStores(json.data?.stores ?? []);
        setCurrencies(json.data?.currencies ?? []);
        setPlatforms(json.data?.platforms ?? []);
        setGamePlatforms(json.data?.gamePlatforms ?? []);
      } catch {
        // Options will remain empty
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };
    loadOptions();
    return () => {
      mounted = false;
    };
  }, [locale]);

  // Reset form when initialData changes (e.g. loading a different game).
  // Use a ref to track the last applied data and avoid spurious resets
  // that would wipe user edits (e.g. after AI translation).
  const lastResetDataRef = useRef<AdminGameFormData | undefined>(undefined);
  useEffect(() => {
    if (initialData && initialData !== lastResetDataRef.current) {
      lastResetDataRef.current = initialData;
      form.reset(initialData);
    }
  }, [initialData, form]);

  const refreshGamePlatforms = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reference-data?locale=${locale}&include=gamePlatforms`);
      if (!res.ok) return;
      const json = await res.json();
      setGamePlatforms(json.data?.gamePlatforms ?? []);
    } catch {
      // Silently fail
    }
  }, [locale]);

  const submitGame = useCallback(
    async (data: AdminGameFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const url = mode === "create" ? "/api/admin/games" : `/api/admin/games/${gameId}`;
        const method = mode === "create" ? "POST" : "PUT";
        const payload = buildGamePayload(data, mode);
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
    stores,
    currencies,
    platforms,
    gamePlatforms,
    loadingOptions,
    submitGame,
    isSubmitting,
    submitError,
    refreshGamePlatforms,
  };
}
