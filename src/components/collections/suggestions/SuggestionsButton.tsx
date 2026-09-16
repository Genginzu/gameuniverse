"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { CollectionSuggestionsController } from "@/hooks/useCollectionSuggestions";

interface SuggestionsButtonProps {
  controller: CollectionSuggestionsController;
}

/**
 * Generate / regenerate trigger for collection suggestions.
 * Meant to sit next to the "Create collection" button.
 */
export function SuggestionsButton({ controller }: SuggestionsButtonProps) {
  const t = useTranslations("collections.suggestions");
  const { hasRequested, isLoading, generate } = controller;

  return (
    <button
      type="button"
      onClick={generate}
      disabled={isLoading}
      className="border-editorial-line text-editorial-muted inline-flex h-14 items-center justify-center gap-2 rounded-[14px] border px-5 text-[0.95rem] font-semibold transition hover:-translate-y-px hover:text-white disabled:opacity-60"
    >
      {isLoading ? (
        <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Icon
          icon={hasRequested ? "lucide:refresh-cw" : "lucide:sparkles"}
          className="h-4 w-4"
          aria-hidden="true"
        />
      )}
      {hasRequested ? t("regenerate") : t("generate")}
    </button>
  );
}
