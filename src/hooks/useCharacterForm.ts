"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import {
  adminCharacterFormSchema,
  type AdminCharacterFormData,
} from "@/lib/validations/admin-character-form";

/** Minimal game info for the games selection tab */
export interface AvailableGame {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

/** Minimal character info for the relationships picker */
export interface AvailableCharacter {
  id: string;
  name: string;
  slug: string;
  mainImage: string | null;
}

export interface UseCharacterFormReturn {
  form: UseFormReturn<AdminCharacterFormData>;
  availableGames: AvailableGame[];
  availableCharacters: AvailableCharacter[];
  loadingOptions: boolean;
  submitCharacter: (data: AdminCharacterFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const DEFAULT_TRANSLATIONS = (locale: string): AdminCharacterFormData["translations"] => [
  {
    language_code: locale === "en" ? "en" : "fr",
    name: "",
    role: "",
    description: "",
    biography: "",
  },
];

export function useCharacterForm(
  mode: "create" | "edit",
  initialData?: AdminCharacterFormData,
  characterId?: string
): UseCharacterFormReturn {
  const locale = useLocale();
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<AvailableCharacter[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AdminCharacterFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(adminCharacterFormSchema) as any,
    defaultValues: initialData ?? {
      slug: "",
      background_color: "",
      main_image_url: "",
      background_image_url: "",
      translations: DEFAULT_TRANSLATIONS(locale),
      games: [],
      relationships: [],
      media: [],
    },
  });

  // Load available games and characters for selection tabs
  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const [gamesRes, charsRes] = await Promise.all([
          fetch(`/api/admin/games?locale=${locale}&limit=100&sort_by=created_at&sort_order=desc`),
          fetch(
            `/api/admin/characters?locale=${locale}&limit=100&sort_by=created_at&sort_order=asc`
          ),
        ]);

        if (!mounted) return;

        if (gamesRes.ok) {
          const gamesJson = await gamesRes.json();
          setAvailableGames(
            (gamesJson.games ?? []).map((g: Record<string, unknown>) => ({
              id: g.id as string,
              title: g.title as string,
              slug: g.slug as string,
              coverImage: (g.coverImage as string) ?? null,
            }))
          );
        }

        if (charsRes.ok) {
          const charsJson = await charsRes.json();
          const chars = (charsJson.characters ?? [])
            .map((c: Record<string, unknown>) => ({
              id: c.id as string,
              name: c.name as string,
              slug: c.slug as string,
              mainImage: (c.mainImage as string) ?? null,
            }))
            .sort((a: AvailableCharacter, b: AvailableCharacter) => a.name.localeCompare(b.name));
          setAvailableCharacters(chars);
        }
      } catch (err) {
        console.error("Failed to load character form options:", err);
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

  const submitCharacter = useCallback(
    async (data: AdminCharacterFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const url =
          mode === "create" ? "/api/admin/characters" : `/api/admin/characters/${characterId}`;
        const method = mode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${mode} character`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} character`;
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, characterId]
  );

  return {
    form,
    availableGames,
    availableCharacters,
    loadingOptions,
    submitCharacter,
    isSubmitting,
    submitError,
  };
}
