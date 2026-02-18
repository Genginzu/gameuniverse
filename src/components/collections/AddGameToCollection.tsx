"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/ui/loading-button";
import { useApiClient } from "@/lib/api-client";
import type { AddCollectionItemInput } from "@/types/collection";
import type { SearchResultItem, HybridSearchResponse } from "@/types/search";
import { SelectedGamePreview, SearchInput } from "./AddGameSearchResults";

interface AddGameToCollectionProps {
  onAdd: (input: AddCollectionItemInput) => Promise<void>;
  isAdding?: boolean;
}

const DEBOUNCE_MS = 300;
const NOTE_MAX_LENGTH = 250;

export function AddGameToCollection({ onAdd, isAdding = false }: AddGameToCollectionProps) {
  const t = useTranslations("collections.addGame");
  const locale = useLocale();
  const apiClient = useApiClient();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<SearchResultItem | null>(null);
  const [note, setNote] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Debounced hybrid search (local + IGDB)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await apiClient.get<HybridSearchResponse>(
          `/api/search/hybrid?query=${encodeURIComponent(query.trim())}&locale=${locale}&localLimit=5&igdbLimit=5`,
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          setResults(data.results ?? []);
          setIsSearching(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, locale, apiClient]);

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

    await onAdd({ gameId, note: note.trim() || undefined });
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
          onSelect={handleSelect}
          placeholder={t("searchPlaceholder")}
          noResultsText={t("noResults")}
        />
      )}

      {selectedGame && (
        <div>
          <Textarea
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            rows={2}
            className="resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
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
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t("addButton")}
        </LoadingButton>
      )}
    </div>
  );
}
