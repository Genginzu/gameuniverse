"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminSimilarGames } from "@/hooks/useAdminSimilarGames";
import { SimilarGameSearchDropdown, SimilarGameRow } from "./SimilarGameParts";
import { Icon } from "@iconify/react";

interface SearchResult { id: string; slug: string; title: string; coverImage: string | null; }

export function GameFormSimilarGamesTab({ gameId }: { gameId: string }) {
  const t = useTranslations("admin.games.form");
  const { similarGames: rawData, loading, error, adding, removing, addSimilarGame, removeSimilarGame } = useAdminSimilarGames(gameId);
  const similarGames = Array.isArray(rawData) ? rawData : [];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setShowDropdown(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/games/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) { const data = await res.json(); setResults(Array.isArray(data) ? data : []); setShowDropdown(true); }
      } catch { setResults([]); } finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDropdown(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = async (game: SearchResult) => {
    setAddError(null);
    const result = await addSimilarGame(game.slug);
    if (result.ok) { setQuery(""); setResults([]); setShowDropdown(false); } else { setAddError(result.error ?? t("similarGamesAddError")); }
  };

  const existingIds = new Set(similarGames.map((sg) => sg.game?.id).filter(Boolean));
  const filteredResults = results.filter((r) => r.id !== gameId && !existingIds.has(r.id));

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>;

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <div ref={containerRef} className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("similarGamesSearchLabel")}</label>
        <div className="relative">
          <Icon icon="fa:search" className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input placeholder={t("similarGamesSearchPlaceholder")} value={query} onChange={(e) => { setQuery(e.target.value); setAddError(null); }} onFocus={() => query.trim().length >= 2 && results.length > 0 && setShowDropdown(true)} className="pl-9" disabled={adding} />
          {searching && <div className="absolute top-1/2 right-3 -translate-y-1/2"><LoadingSpinner size="sm" /></div>}
        </div>
        {showDropdown && <SimilarGameSearchDropdown results={filteredResults} searching={searching} query={query} onSelect={handleSelect} adding={adding} t={t} />}
      </div>

      {addError && <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>}

      {similarGames.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">{t("similarGamesEmpty")}</p>
      ) : (
        <div className="space-y-2">
          {similarGames.map((sg) => <SimilarGameRow key={sg.id} sg={sg} removing={removing} onRemove={removeSimilarGame} t={t} />)}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">{t("similarGamesCount", { count: similarGames.length })}</p>
    </div>
  );
}
