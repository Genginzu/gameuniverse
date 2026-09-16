"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import Image from "next/image";
import type { CollectionSuggestion } from "@/types/smartCollection";

interface SuggestionCardProps {
  suggestion: CollectionSuggestion;
  onAccept: (name: string) => Promise<void>;
  onIgnore: () => void;
}

/** Cover mosaic (up to 4) shown as the card preview. */
function PreviewMosaic({ suggestion }: { suggestion: CollectionSuggestion }) {
  const previews = suggestion.previewGames.slice(0, 4);
  return (
    <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
      {previews.map((game) => (
        <div key={game.id} className="bg-editorial-1 relative aspect-[3/4]">
          {game.coverImage ? (
            <Image
              src={game.coverImage}
              alt={game.title}
              fill
              sizes="(max-width: 768px) 50vw, 12vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Icon icon="lucide:gamepad-2" className="text-editorial-muted h-6 w-6" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * A single auto-generated collection suggestion card.
 * Resolves the localized name, shows a cover preview + count, and exposes
 * Create / Ignore actions with a short creation animation.
 */
export function SuggestionCard({ suggestion, onAccept, onIgnore }: SuggestionCardProps) {
  const t = useTranslations("collections.suggestions");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const params = { ...suggestion.titleParams } as Record<string, string | number>;
  if (suggestion.criterion === "platform" && typeof params.platform === "string") {
    const platformKey = `platforms.${params.platform}`;
    params.platform = t.has(platformKey) ? t(platformKey) : params.platform;
  }
  const name = t(`names.${suggestion.titleKey}`, params);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onAccept(name);
      setIsCreated(true);
    } catch {
      setIsCreating(false);
    }
  };

  return (
    <article
      className={`border-editorial-line bg-editorial-2 relative flex flex-col gap-4 rounded-2xl border p-4 transition-all duration-500 ${
        isCreated ? "scale-95 opacity-0" : "opacity-100"
      }`}
      aria-busy={isCreating}
    >
      {isCreated && (
        <div className="bg-editorial-accent/10 absolute inset-0 z-10 grid place-items-center rounded-2xl">
          <Icon icon="lucide:check-circle-2" className="text-editorial-accent h-10 w-10" />
        </div>
      )}

      <PreviewMosaic suggestion={suggestion} />

      <div className="flex-1">
        <h3 className="font-display text-lg font-bold text-white">{name}</h3>
        <p className="text-editorial-muted mt-1 text-sm">
          {t("gamesCount", { count: suggestion.gamesCount })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          className="bg-editorial-accent inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-[#0a0418] transition hover:brightness-110 disabled:opacity-60"
        >
          {isCreating ? (
            <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
          ) : (
            <Icon icon="lucide:plus" className="h-4 w-4" />
          )}
          {t("create")}
        </button>
        <button
          type="button"
          onClick={onIgnore}
          disabled={isCreating}
          className="border-editorial-line text-editorial-muted inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:text-white disabled:opacity-60"
        >
          {t("ignore")}
        </button>
      </div>
    </article>
  );
}
