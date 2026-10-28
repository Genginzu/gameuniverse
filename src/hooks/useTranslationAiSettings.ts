"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import type { TranslationAiSettings } from "@/types/admin-translations";

const SETTINGS_KEY = "/api/admin/translations/ai-settings";

/** Translation model picker + Vercel AI Gateway credits for the admin translations page. */
export function useTranslationAiSettings() {
  const { data, error, isLoading, mutate } = useSWR<TranslationAiSettings>(SETTINGS_KEY);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate]);

  const updateModel = useCallback(
    async (model: string) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(SETTINGS_KEY, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Save failed (${res.status})`);
        }
        await mutate((current) => (current ? { ...current, model } : current), {
          revalidate: false,
        });
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setIsSaving(false);
      }
    },
    [mutate]
  );

  return {
    settings: data,
    isLoading,
    loadError: error as Error | undefined,
    isSaving,
    isRefreshing,
    saveError,
    updateModel,
    refresh,
  };
}
