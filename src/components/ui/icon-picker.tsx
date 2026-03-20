"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchIcons } from "@/lib/utils/icon-registry";


interface IconPickerProps {
  value: string | null;
  onChange: (iconName: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function IconPicker({ value, onChange, placeholder, className }: IconPickerProps) {
  const t = useTranslations("iconPicker");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  /* Debounced search against Iconify API */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      const hits = await searchIcons(query);
      setResults(hits);
      setIsLoading(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange(iconName);
      setIsOpen(false);
      setQuery("");
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery("");
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      {/* Trigger button — shows selected icon or placeholder */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
          "border-input bg-background hover:border-ring/50",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        {value ? (
          <>
            <Icon icon={value} className="h-5 w-5 shrink-0 text-gray-700 dark:text-gray-300" />
            <span className="truncate text-gray-700 dark:text-gray-300">{value}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{placeholder ?? t("placeholder")}</span>
        )}
        {value && (
          <Icon icon="fa:times"
            className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-xl border p-3",
            "border-white/20 bg-white/80 shadow-lg shadow-black/5 backdrop-blur-xl",
            "dark:border-slate-700/50 dark:bg-slate-800/80 dark:shadow-black/20"
          )}
        >
          {/* Search input */}
          <div className="relative mb-2">
            <Icon icon="fa:search" className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"  />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Status line */}
          <p className="mb-2 text-xs text-muted-foreground">
            {isLoading
              ? t("loading")
              : query.trim()
                ? t("resultsCount", { count: results.length })
                : t("typeToSearch")}
          </p>

          {/* Icon grid */}
          <div className="grid max-h-48 grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-8">
            {results.map((entry) => {
              const isSelected = value === entry.name;
              return (
                <button
                  key={entry.name}
                  type="button"
                  title={entry.name}
                  onClick={() => handleSelect(entry.name)}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-lg transition-all",
                    isSelected
                      ? "bg-linear-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc] text-white"
                      : "text-gray-700 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-slate-700/60"
                  )}
                >
                  <Icon icon={entry.name} className="h-5 w-5" />
                </button>
              );
            })}
          </div>

          {!isLoading && query.trim() && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("noResults")}</p>
          )}
        </div>
      )}

      {/* Click-outside overlay */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
