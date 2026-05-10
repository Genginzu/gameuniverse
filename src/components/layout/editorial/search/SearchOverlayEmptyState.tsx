"use client";

/**
 * SearchOverlayEmptyState : contenu affiché tant que l'utilisateur n'a pas
 * tapé de requête (ou que la requête fait moins de 2 caractères).
 *
 * - Liste cliquable des recherches récentes (depuis localStorage)
 * - Croix par entrée pour supprimer une recherche
 * - Lien "Effacer tout"
 * - Si aucune recherche récente : message "Commencez à saisir…"
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface SearchOverlayEmptyStateProps {
  recentSearches: string[];
  /** Appelé quand l'utilisateur clique sur une recherche récente. */
  onSelectRecent: (query: string) => void;
  /** Appelé pour supprimer une recherche récente individuelle. */
  onRemoveRecent: (query: string) => void;
  /** Appelé pour effacer toute l'historique. */
  onClearAll: () => void;
}

export function SearchOverlayEmptyState({
  recentSearches,
  onSelectRecent,
  onRemoveRecent,
  onClearAll,
}: SearchOverlayEmptyStateProps) {
  const t = useTranslations("globalSearch.overlay");
  const tRecent = useTranslations("globalSearch.overlay.recent");

  if (recentSearches.length === 0) {
    return (
      <div className="search-overlay-empty">
        <p className="search-overlay-empty-hint">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="search-overlay-empty" data-testid="search-overlay-empty">
      <div className="search-overlay-recent-header">
        <h2 className="editorial-kicker">{tRecent("title")}</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="search-overlay-recent-clear-all"
        >
          {tRecent("clearAll")}
        </button>
      </div>
      <ul className="search-overlay-recent-list">
        {recentSearches.map((query) => (
          <li key={query} className="search-overlay-recent-item">
            <button
              type="button"
              onClick={() => onSelectRecent(query)}
              className="search-overlay-recent-button"
            >
              <Icon icon="lucide:clock" className="size-4 shrink-0" aria-hidden />
              <span>{query}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveRecent(query);
              }}
              aria-label={tRecent("removeAriaLabel", { query })}
              className="search-overlay-recent-remove"
            >
              <Icon icon="lucide:x" className="size-3" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
