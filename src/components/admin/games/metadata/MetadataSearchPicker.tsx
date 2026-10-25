"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { useAdminMetadataSearch } from "@/hooks/useAdminMetadataSearch";
import type { AdminMetadataSearchKind } from "@/types/game-metadata";

export interface PickedReference {
  id: string;
  name?: string;
}

interface MetadataSearchPickerProps {
  kind: AdminMetadataSearchKind;
  title: string;
  selected: PickedReference[];
  onChange: (next: PickedReference[]) => void;
  indicator?: React.ReactNode;
}

/** Selected chips plus a name search over a large reference table (franchises, engines…). */
export function MetadataSearchPicker({ kind, title, selected, onChange, indicator }: MetadataSearchPickerProps) {
  const t = useTranslations("admin.games.form.metadata");
  const [query, setQuery] = useState("");
  const { results, loading } = useAdminMetadataSearch(kind, query);
  const selectedIds = new Set(selected.map((item) => item.id));
  const candidates = results.filter((row) => !selectedIds.has(row.id));

  const add = (id: string, name: string) => {
    onChange([...selected, { id, name }]);
    setQuery("");
  };

  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {title}
        <span className="font-normal text-gray-400">({selected.length})</span>
        {indicator}
      </legend>
      {selected.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {selected.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(selected.filter((other) => other.id !== item.id))}
                className="border-primary bg-primary/10 text-primary dark:bg-primary/20 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-300 hover:opacity-80"
                aria-label={t("remove", { name: item.name ?? item.id })}
              >
                {item.name ?? item.id}
                <Icon icon="mdi:close" className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <Icon
          icon="mdi:magnify"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel", { field: title })}
          className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white/60 py-2 pr-3 pl-9 text-base text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800/60 dark:text-white"
        />
      </div>
      {query.trim().length >= 2 && (
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-200/60 bg-white/60 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/60">
          {candidates.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => add(row.id, row.name ?? row.id)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100/60 dark:text-gray-200 dark:hover:bg-gray-700/60"
              >
                <span className="truncate">{row.name}</span>
                <Icon icon="mdi:plus" className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              </button>
            </li>
          ))}
          {!loading && candidates.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400">{t("noResults")}</li>
          )}
        </ul>
      )}
    </fieldset>
  );
}
