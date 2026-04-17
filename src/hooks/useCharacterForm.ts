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

/** Minimal role info for the role selection */
export interface AvailableRole {
  id: string;
  slug: string;
  name: string;
}

export interface UseCharacterFormReturn {
  form: UseFormReturn<AdminCharacterFormData>;
  availableGames: AvailableGame[];
  availableCharacters: AvailableCharacter[];
  availableRoles: AvailableRole[];
  loadingOptions: boolean;
  submitCharacter: (data: AdminCharacterFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const DEFAULT_TRANSLATIONS = (): AdminCharacterFormData["translations"] => [
  { language_code: "fr", name: "", role: "", description: "", biography: "", weapons: "" },
  { language_code: "en", name: "", role: "", description: "", biography: "", weapons: "" },
];

export function useCharacterForm(
  mode: "create" | "edit",
  initialData?: AdminCharacterFormData,
  characterId?: string
): UseCharacterFormReturn {
  const locale = useLocale();
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<AvailableCharacter[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
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
      translations: DEFAULT_TRANSLATIONS(),
      games: [],
      relationships: [],
      media: [],
      role_ids: [],
      gender_id: null,
      species_id: null,
    },
  });

  // Load available games and characters for selection tabs
  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const [gamesRes, charsRes, rolesRes] = await Promise.all([
          fetch(`/api/admin/games?locale=${locale}&limit=100&sort_by=created_at&sort_order=desc`),
          fetch(
            `/api/admin/characters?locale=${locale}&limit=100&sort_by=created_at&sort_order=asc`
          ),
          fetch(`/api/admin/roles?locale=${locale}&limit=100&sort_by=name&sort_order=asc`),
        ]);

        if (!mounted) return;

        if (gamesRes.ok) {
          const gamesJson = await gamesRes.json();
          const loadedGames: AvailableGame[] = (gamesJson.games ?? []).map(
            (g: Record<string, unknown>) => ({
              id: g.id as string,
              title: g.title as string,
              slug: g.slug as string,
              coverImage: (g.coverImage as string) ?? null,
            })
          );

          // In edit mode, ensure assigned games are included even if not in the top 100
          const assignedGameIds = (initialData?.games ?? []).map((g) => g.game_id);
          const loadedIds = new Set(loadedGames.map((g) => g.id));
          const missingIds = assignedGameIds.filter((id) => !loadedIds.has(id));

          if (missingIds.length > 0) {
            const missingResults = await Promise.all(
              missingIds.map((id) =>
                fetch(`/api/admin/games/${id}?locale=${locale}`)
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null)
              )
            );
            for (const g of missingResults) {
              if (g) {
                // The detail endpoint returns translations array + cover_image_url
                const translations =
                  (g.translations as Array<{ language_code: string; title: string }>) ?? [];
                const tr =
                  translations.find((t: { language_code: string }) => t.language_code === locale) ??
                  translations[0];
                loadedGames.push({
                  id: g.id as string,
                  title: tr?.title ?? (g.slug as string),
                  slug: g.slug as string,
                  coverImage: (g.cover_image_url as string) ?? null,
                });
              }
            }
          }

          setAvailableGames(loadedGames);
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

        if (rolesRes.ok) {
          const rolesJson = await rolesRes.json();
          setAvailableRoles(
            (rolesJson.roles ?? []).map((r: Record<string, unknown>) => {
              const translations =
                (r.translations as Array<{ language_code: string; name: string }>) ?? [];
              const tr = translations.find((t) => t.language_code === locale) ?? translations[0];
              return {
                id: r.id as string,
                slug: r.slug as string,
                name: tr?.name ?? (r.slug as string),
              };
            })
          );
        }
      } catch {
        // Erreur ignorée — les options seront vides
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
  }, [initialData]);

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
    availableRoles,
    loadingOptions,
    submitCharacter,
    isSubmitting,
    submitError,
  };
}
