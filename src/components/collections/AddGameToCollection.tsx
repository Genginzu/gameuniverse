"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/ui/loading-button";
import { useApiClient } from "@/lib/api-client";
import type { AddCollectionItemInput } from "@/types/collection";
import type { SearchResultItem, HybridSearchResponse } from "@/types/search";
import { SelectedGamePreview, SearchInput } from "./AddGameSearchResults";

interface AddGameToCollectionProps {
  onAdd: (input: AddCollectionItemInput) => Promise<void>;
  isAdding?: boolean;
  /** Affiche le champ note (défaut: true). Mettre à false pour la bibliothèque. */
  showNote?: boolean;
  /** Libellé du bouton d'ajout. Défaut: `collections.addGame.addButton`. */
  addButtonLabel?: string;
}

const DEBOUNCE_MS = 300;
const NOTE_MAX_LENGTH = 250;
const PAGE_SIZE = 10;

export function AddGameToCollection({
  onAdd,
  isAdding = false,
  showNote = true,
  addButtonLabel,
}: AddGameToCollectionProps) {
  const t = useTranslations("collections.addGame");
  const locale = useLocale();
  const apiClient = useApiClient();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selectedGame, setSelectedGame] = useState<SearchResultItem | null>(null);
  const [note, setNote] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(
    async (searchLimit: number, signal: AbortSignal) => {
      const data = await apiClient.get<HybridSearchResponse>(
        `/api/search/hybrid?query=${encodeURIComponent(
          query.trim()
        )}&locale=${locale}&localLimit=${searchLimit}&igdbLimit=${searchLimit}`,
        { signal }
      );
      if (!signal.aborted) {
        setResults(data.results ?? []);
        setHasMore(data.hasMore ?? false);
      }
    },
    [query, locale, apiClient]
  );

  // Debounced hybrid search (local + IGDB), reset to the first page on query change
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      setHasMore(false);
      setLimit(PAGE_SIZE);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLimit(PAGE_SIZE);
        await runSearch(PAGE_SIZE, controller.signal);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, locale, apiClient, runSearch]);

  // Grow the result window when the user scrolls near the bottom
  const loadMore = useCallback(async () => {
    if (isLoadingMore || isSearching || !hasMore) return;

    const nextLimit = limit + PAGE_SIZE;
    setIsLoadingMore(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runSearch(nextLimit, controller.signal);
      if (!controller.signal.aborted) setLimit(nextLimit);
    } catch {
      // keep the current results on failure
    } finally {
      if (!controller.signal.aborted) setIsLoadingMore(false);
    }
  }, [isLoadingMore, isSearching, hasMore, limit, runSearch]);

  const handleSelect = useCallback((game: SearchResultItem) => {
    setSelectedGame(game);
    setQuery("");
    setResults([]);
  }, []);

  const handleSubmit = async () => {
    if (!selectedGame) return;

    let gameId = selectedGame.id;

    // Si le jeu vient d'IGDB, l'importer d'abord dans la DB locale
    if (selectedGame.source === "igdb" && selectedGame.igdbId) {
      setIsImporting(true);
      try {
        const importResult = await apiClient.post<{ success: boolean; game?: { id: string } }>(
          "/api/games/import",
          { igdbId: selectedGame.igdbId }
        );
        if (!importResult.success || !importResult.game?.id) {
          throw new Error("Import failed");
        }
        gameId = importResult.game.id;
      } catch {
        setIsImporting(false);
        return;
      }
      setIsImporting(false);
    }

    await onAdd({ gameId, note: showNote ? note.trim() || undefined : undefined });
    setSelectedGame(null);
    setNote("");
  };

  const handleClearSelection = useCallback(() => {
    setSelectedGame(null);
    setNote("");
  }, []);

  const submitting = isAdding || isImporting;
  const submitText = isImporting ? t("importing") : t("adding");

  return (
    <div className="space-y-4">
      {selectedGame ? (
        <SelectedGamePreview game={selectedGame} onClear={handleClearSelection} />
      ) : (
        <SearchInput
          query={query}
          onChange={setQuery}
          results={results}
          isSearching={isSearching}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onSelect={handleSelect}
          placeholder={t("searchPlaceholder")}
          noResultsText={t("noResults")}
        />
      )}

      {selectedGame && showNote && (
        <div>
          <Textarea
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            rows={2}
            className="border-editorial-line bg-editorial-3 resize-none text-white placeholder:text-editorial-muted"
          />
          <p className="text-editorial-muted mt-1 text-xs">
            {note.length}/{NOTE_MAX_LENGTH}
          </p>
        </div>
      )}

      {selectedGame && (
        <LoadingButton
          onClick={handleSubmit}
          loading={submitting}
          loadingText={submitText}
          disabled={!selectedGame}
          className="w-full border border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.15)] text-[rgb(var(--accent-rgb,var(--neon-primary)))] shadow-none hover:bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.25)]"
        >
          <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
          {addButtonLabel ?? t("addButton")}
        </LoadingButton>
      )}
    </div>
  );
}
