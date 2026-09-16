"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useLocale } from "next-intl";
import type { CollectionSuggestion } from "@/types/smartCollection";

interface SuggestionsResponse {
  suggestions: CollectionSuggestion[];
}

interface AcceptPayload {
  name: string;
  gameIds: string[];
}

/** Shared controller returned by the hook, consumed by button + results. */
export interface CollectionSuggestionsController {
  suggestions: CollectionSuggestion[];
  isLoading: boolean;
  error: string | null;
  /** True once the user has triggered a generation at least once. */
  hasRequested: boolean;
  /** Trigger a generation, or regenerate if already requested. */
  generate: () => void;
  /** Accept a suggestion: create the collection, then drop it from the list. */
  accept: (id: string, payload: AcceptPayload) => Promise<{ slug: string }>;
  /** Locally dismiss a suggestion without creating anything. */
  dismiss: (id: string) => void;
}

/**
 * Hook fetching auto-generated collection suggestions for the current user.
 * Generation is opt-in: nothing is fetched until `generate()` is called.
 * Accepted/dismissed suggestions are hidden client-side for the session.
 */
export function useCollectionSuggestions(
  canGenerate: boolean = true
): CollectionSuggestionsController {
  const locale = useLocale();
  const [requested, setRequested] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const enabled = canGenerate && requested;
  const { data, error, isLoading, mutate } = useSWR<SuggestionsResponse>(
    enabled ? `/api/collections/suggestions?locale=${locale}` : null
  );

  const generate = useCallback(() => {
    if (!canGenerate) return;
    if (requested) {
      void mutate();
    } else {
      setRequested(true);
    }
  }, [canGenerate, requested, mutate]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const accept = useCallback(
    async (id: string, payload: AcceptPayload) => {
      const res = await fetch("/api/collections/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || "Failed to create collection");
      }
      dismiss(id);
      return (body as { collection: { slug: string } }).collection;
    },
    [dismiss]
  );

  const suggestions = useMemo(
    () => (data?.suggestions ?? []).filter((s) => !dismissed.has(s.id)),
    [data, dismissed]
  );

  return {
    suggestions,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch suggestions") : null,
    hasRequested: requested,
    generate,
    accept,
    dismiss,
  };
}
