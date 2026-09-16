"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";

interface GameSearchResult {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
}

interface GameLinkPickerProps {
  onSelect: (gameId: string) => void;
  disabled?: boolean;
}

/**
 * Debounced admin game search (reuses /api/admin/games/search) used to pick a
 * local game to link an unmatched platform title to.
 */
export function GameLinkPicker({ onSelect, disabled }: GameLinkPickerProps) {
  const t = useTranslations("admin.librarySync");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/games/search?q=${encodeURIComponent(query.trim())}&locale=${locale}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          setResults((await res.json()) as GameSearchResult[]);
          setOpen(true);
        }
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
  }, [query, locale]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full min-w-[220px]">
      <div className="relative">
        <Icon
          icon={loading ? "lucide:loader-2" : "lucide:search"}
          className={`pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400 ${
            loading ? "animate-spin" : ""
          }`}
        />
        <Input
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t("searchGame")}
          className="h-9 pl-8 text-base"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(g.id);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700"
              >
                {g.coverImage ? (
                  <img
                    src={g.coverImage}
                    alt=""
                    className="h-8 w-6 rounded border border-gray-200 object-cover dark:border-gray-600"
                  />
                ) : (
                  <span className="grid h-8 w-6 place-items-center rounded border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                    <Icon icon="lucide:gamepad-2" className="h-3 w-3 text-gray-400" />
                  </span>
                )}
                <span className="truncate">{g.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {t("noGameResults")}
        </div>
      )}
    </div>
  );
}
