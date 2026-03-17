"use client";

import { type FieldErrors } from "react-hook-form";
import { FaExclamationTriangle } from "react-icons/fa";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { TabId } from "@/types/admin-games";

/** Maps form field names to the tab they belong to */
const FIELD_TO_TAB: Record<string, TabId> = {
  background_color: "design",
  accent_color: "design",
  label_color: "design",
  text_color: "design",
  release_date: "general",
  metascore: "general",
  playtime_hastily: "general",
  playtime_normally: "general",
  playtime_completely: "general",
  cover_image_url: "images",
  background_image_url: "images",
  screenshots: "images",
  artwork: "images",
  translations: "translations",
  genres: "genres",
  companies: "companies",
  age_ratings: "age_ratings",
  versions: "versions",
  languages: "languages",
  prices: "pricing",
  music_composer: "music",
  music_spotify_embed_url: "music",
  music_youtube_video_url: "music",
};

/** Human-readable tab labels (used as fallback, actual labels come from i18n) */
const TAB_LABELS: Record<TabId, string> = {
  design: "Design",
  general: "General",
  images: "Images",
  translations: "Translations",
  genres: "Genres",
  companies: "Companies",
  age_ratings: "Age Ratings",
  versions: "Versions",
  languages: "Languages",
  pricing: "Pricing",
  music: "Music",
  sync: "Sync",
};

interface ErrorsByTab {
  tabId: TabId;
  messages: string[];
}

/** Extracts a flat list of error messages from potentially nested FieldErrors */
function extractMessages(error: unknown): string[] {
  if (!error || typeof error !== "object") return [];

  // Direct error with message
  if ("message" in error && typeof (error as { message: unknown }).message === "string") {
    return [(error as { message: string }).message];
  }

  // Root-level refinement errors (e.g. translations array refine)
  if ("root" in error) {
    const rootMsgs = extractMessages((error as Record<string, unknown>).root);
    if (rootMsgs.length > 0) return rootMsgs;
  }

  // Array of errors (e.g. translations.0, translations.1)
  const messages: string[] = [];
  for (const value of Object.values(error as Record<string, unknown>)) {
    messages.push(...extractMessages(value));
  }
  return messages;
}

/** Groups form errors by tab for display */
function groupErrorsByTab(errors: FieldErrors<AdminGameFormData>): ErrorsByTab[] {
  const grouped = new Map<TabId, Set<string>>();

  for (const [field, error] of Object.entries(errors)) {
    const tabId = FIELD_TO_TAB[field];
    if (!tabId) continue;

    const messages = extractMessages(error);
    if (messages.length === 0) continue;

    if (!grouped.has(tabId)) grouped.set(tabId, new Set());
    const set = grouped.get(tabId)!;
    messages.forEach((m) => set.add(m));
  }

  return Array.from(grouped.entries()).map(([tabId, msgs]) => ({
    tabId,
    messages: Array.from(msgs),
  }));
}

interface GameFormErrorSummaryProps {
  errors: FieldErrors<AdminGameFormData>;
  onNavigateToTab: (tabId: TabId) => void;
  tabLabel: (tabId: TabId) => string;
}

/** Displays all validation errors grouped by tab, above the tab navigation */
export function GameFormErrorSummary({
  errors,
  onNavigateToTab,
  tabLabel,
}: GameFormErrorSummaryProps) {
  const errorGroups = groupErrorsByTab(errors);
  if (errorGroups.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
        <FaExclamationTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          {errorGroups.reduce((sum, g) => sum + g.messages.length, 0)} erreur(s) à corriger
        </span>
      </div>
      <ul className="space-y-1">
        {errorGroups.map(({ tabId, messages }) => (
          <li key={tabId}>
            <button
              type="button"
              onClick={() => onNavigateToTab(tabId)}
              className="text-sm font-medium text-red-600 underline decoration-red-300 underline-offset-2 hover:text-red-800 dark:text-red-400 dark:decoration-red-700 dark:hover:text-red-300"
            >
              {tabLabel(tabId) || TAB_LABELS[tabId]}
            </button>
            <span className="text-sm text-red-600/80 dark:text-red-400/80">
              {" — "}
              {messages.join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
