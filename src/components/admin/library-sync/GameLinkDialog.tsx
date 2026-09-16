"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface GameSearchResult {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
}

interface GameLinkDialogProps {
  open: boolean;
  /** Title pre-filled in the search box (the unmatched platform title). */
  initialQuery: string;
  onClose: () => void;
  onSelect: (gameId: string) => void;
}

const SEARCH_LIMIT = 50;

/**
 * Centered game-search dialog (same UX as the editorial search overlay, admin
 * styling). Pre-fills the platform title so the admin just picks the right game
 * from a generous result list.
 */
export function GameLinkDialog({ open, initialQuery, onClose, onSelect }: GameLinkDialogProps) {
  const t = useTranslations("admin.librarySync");
  const locale = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the query to the pre-filled title each time the dialog opens.
  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setResults([]);
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
          `/api/admin/games/search?q=${encodeURIComponent(query.trim())}&locale=${locale}&limit=${SEARCH_LIMIT}`,
          { signal: controller.signal }
        );
        if (res.ok) setResults((await res.json()) as GameSearchResult[]);
      } catch {
        /* aborted / ignored */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, locale, open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
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

        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
          {query.trim().length < 2 ? (
            <p className="p-6 text-center text-sm text-gray-400">{t("searchHint")}</p>
          ) : !loading && results.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">{t("noGameResults")}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(g.id)}
                    className="flex w-full items-center gap-3 bg-white px-4 py-2.5 text-left hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {g.coverImage ? (
                      <img
                        src={g.coverImage}
                        alt=""
                        className="h-14 w-10 shrink-0 rounded border border-gray-200 object-cover dark:border-gray-600"
                      />
                    ) : (
                      <span className="grid h-14 w-10 shrink-0 place-items-center rounded border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                        <Icon icon="lucide:gamepad-2" className="h-4 w-4 text-gray-400" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                        {g.title}
                      </span>
                      <span className="block truncate text-xs text-gray-400">{g.slug}</span>
                    </span>
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
