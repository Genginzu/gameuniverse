"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { CollectionSuggestionsController } from "@/hooks/useCollectionSuggestions";
import { SuggestionCard } from "./SuggestionCard";

interface SuggestedCollectionsProps {
  controller: CollectionSuggestionsController;
  /** Refetch the collections list after a suggestion is accepted. */
  onCreated?: () => void | Promise<void>;
}

/**
 * Results area for auto-generated collection suggestions.
 * Generation is triggered elsewhere via {@link SuggestionsButton}; this only
 * renders the loading / empty / results states once a generation was requested.
 */
export function SuggestedCollections({ controller, onCreated }: SuggestedCollectionsProps) {
  const t = useTranslations("collections.suggestions");
  const { suggestions, isLoading, hasRequested, accept, dismiss } = controller;

  if (!hasRequested) {
    return null;
  }

  return (
    <section className="mb-12" aria-label={t("title")}>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="bg-editorial-accent/15 text-editorial-accent grid size-9 place-items-center rounded-full">
          <Icon icon="lucide:sparkles" className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-white">{t("title")}</h2>
          <p className="text-editorial-muted text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {isLoading && <p className="text-editorial-muted text-sm">{t("loading")}</p>}

      {!isLoading && suggestions.length === 0 && (
        <div className="border-editorial-line bg-editorial-2 rounded-2xl border px-6 py-10 text-center">
          <p className="text-editorial-muted">{t("empty")}</p>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={async (name) => {
                await accept(suggestion.id, { name, gameIds: suggestion.gameIds });
                await onCreated?.();
              }}
              onIgnore={() => dismiss(suggestion.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
