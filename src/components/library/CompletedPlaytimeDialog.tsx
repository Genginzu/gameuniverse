"use client";

/**
 * CompletedPlaytimeDialog : opened on `/library` when a game is set to
 * "completed", to fill the three playtimes (rapid / normal / completionist).
 * Reuses the game-detail `PlayerPlaytimeForm`, prefilled once the player's
 * current playtime is loaded; the library stats are refreshed after saving.
 */

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSWRConfig } from "swr";

import { PlayerPlaytimeForm } from "@/components/games/details/PlayerPlaytimeForm";
import { usePlayerPlaytime } from "@/hooks/usePlayerPlaytime";
import { LIBRARY_STATS_KEY } from "@/lib/swr/keys";
import type { PlayerPlaytimeEntry } from "@/types/game";

interface CompletedPlaytimeDialogProps {
  slug: string;
  title: string;
  onClose: () => void;
}

export function CompletedPlaytimeDialog({ slug, title, onClose }: CompletedPlaytimeDialogProps) {
  const t = useTranslations("libraryStatus");
  const { mutate } = useSWRConfig();
  const { stats, loading, submitting, error, submitPlaytime } = usePlayerPlaytime(slug);

  const handleSubmit = useCallback(
    async (entry: Partial<PlayerPlaytimeEntry>) => {
      const saved = await submitPlaytime(entry);
      if (saved) await mutate(LIBRARY_STATS_KEY);
      return saved;
    },
    [submitPlaytime, mutate]
  );

  // Mounted once loaded: the form reads its initial values on mount only.
  if (loading) return null;

  return (
    <PlayerPlaytimeForm
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      currentPlaytime={stats.userPlaytime}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      title={t("completedPlaytimeTitle", { title })}
      description={t("completedPlaytimeDescription")}
    />
  );
}
