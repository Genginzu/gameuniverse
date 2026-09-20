"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface IgdbSearchResult {
  igdbId: number;
  name: string;
  slug: string;
  coverUrl: string | null;
  releaseYear: number | null;
  developer: string | null;
}

interface GameLinkDialogProps {
  open: boolean;
  /** Title pre-filled in the search box (the unmatched platform title). */
  initialQuery: string;
  onClose: () => void;
  /** Link the match to the chosen IGDB game (imported locally if needed). */
  onSelect: (igdbId: number) => Promise<void> | void;
}

const SEARCH_LIMIT = 50;

/**
 * Centered game-search dialog that queries IGDB directly (not the local DB), so
 * any IGDB game can be linked — imported on selection if not present locally.
 * Pre-fills the platform title so the admin just picks the right game.
 */
export function GameLinkDialog({ open, initialQuery, onClose, onSelect }: GameLinkDialogProps) {
  const t = useTranslations("admin.librarySync");
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<IgdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setResults([]);
      setLinkingId(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/library-sync/igdb-search?q=${encodeURIComponent(query.trim())}&limit=${SEARCH_LIMIT}`,
          { signal: controller.signal }
        );
        if (res.ok) setResults((await res.json()) as IgdbSearchResult[]);
      } catch {
        /* aborted / ignored */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, open]);

  const handleSelect = async (igdbId: number) => {
    if (linkingId !== null) return;
    setLinkingId(igdbId);
    try {
      await onSelect(igdbId);
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && linkingId === null && onClose()}>
      <DialogContent className="top-[8%] max-w-xl translate-y-0 gap-4">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">{t("dialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Icon
            icon={loading ? "lucide:loader-2" : "lucide:search"}
            className={`pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400 ${
              loading ? "animate-spin" : ""
            }`}
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchGame")}
            className="h-12 pl-10 text-base"
          />
        </div>

        <p className="text-xs text-gray-400">{t("igdbHint")}</p>

        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
          {query.trim().length < 2 ? (
            <p className="p-6 text-center text-sm text-gray-400">{t("searchHint")}</p>
          ) : !loading && results.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">{t("noGameResults")}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((g) => (
                <li key={g.igdbId}>
                  <button
                    type="button"
                    disabled={linkingId !== null}
                    onClick={() => handleSelect(g.igdbId)}
                    className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {g.coverUrl ? (
                      <img
                        src={g.coverUrl}
                        alt=""
                        className="h-24 w-16 shrink-0 rounded-md border border-gray-200 object-cover dark:border-gray-600"
                      />
                    ) : (
                      <span className="grid h-24 w-16 shrink-0 place-items-center rounded-md border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                        <Icon icon="lucide:gamepad-2" className="h-6 w-6 text-gray-400" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                        {g.name}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {[g.developer, g.releaseYear].filter(Boolean).join(" · ") || g.slug}
                      </span>
                    </span>
                    {linkingId === g.igdbId && (
                      <Icon icon="lucide:loader-2" className="h-5 w-5 shrink-0 animate-spin text-gray-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
