"use client";

import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import type { MentionSuggestion } from "@/hooks/useMentionAutocomplete";

interface MentionSuggestionsProps {
  suggestions: MentionSuggestion[];
  isLoading: boolean;
  isOpen: boolean;
  selectedIndex: number;
  onSelect: (username: string) => void;
}

export function MentionSuggestions({
  suggestions,
  isLoading,
  isOpen,
  selectedIndex,
  onSelect,
}: MentionSuggestionsProps) {
  if (!isOpen) return null;

  return (
    <div
      role="listbox"
      className="glass-dropdown absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-xl border border-white/20 shadow-lg shadow-black/10 dark:border-slate-700/50 dark:shadow-black/30"
    >
      {isLoading && suggestions.length === 0 && (
        <div className="flex items-center justify-center py-3">
          <Icon
            icon="lucide:loader-2"
            className="h-4 w-4 animate-spin text-gray-400 dark:text-slate-500"
          />
        </div>
      )}

      {!isLoading && suggestions.length === 0 && (
        <p className="px-3 py-2.5 text-xs text-gray-400 dark:text-slate-500">Aucun joueur trouvé</p>
      )}

      {suggestions.map((player, index) => (
        <button
          key={player.id}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(player.username)}
          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
            index === selectedIndex
              ? "bg-palette-primary-500/10 dark:bg-palette-primary-400/10"
              : "hover:bg-white/40 dark:hover:bg-slate-700/40"
          }`}
        >
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
            {player.avatarUrl ? (
              <LazyImage
                src={player.avatarUrl}
                alt={player.username}
                fill
                className="object-cover"
                sizes="28px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon icon="lucide:user" className="h-3.5 w-3.5 text-blue-300" />
              </div>
            )}
          </div>
          <span className="truncate text-sm font-medium text-gray-800 dark:text-slate-200">
            @{player.username}
          </span>
        </button>
      ))}
    </div>
  );
}
