"use client";

/**
 * SearchOverlay : overlay full-page de recherche déclenché par
 * `HeaderSearchTrigger` (F0-07b) ou `Ctrl+K` / `Cmd+K`. Toute la saisie et
 * l'affichage des résultats se font ici.
 *
 * - Backdrop opaque `--editorial-bg` (pas de blur)
 * - Input centré avec spinner de chargement
 * - Résultats groupés par type d'entité (jeux, personnages, joueurs, équipes
 *   esport, joueurs pros, coachs)
 * - État vide : recherches récentes (localStorage, max 5) + bouton "Effacer
 *   tout"
 * - Navigation clavier : ↑↓ (entre items), Tab / Shift+Tab (change d'onglet
 *   de filtre), Enter (sélection), Escape (close)
 * - Body scroll lock, focus trap et fermeture (Escape, clic backdrop) via
 *   `useDismissableLayer`
 * - Fermeture : ╳, Escape, clic backdrop, ou sélection d'un résultat
 *
 * Voir docs/design/editorial-refonte-plan.md section 5.6.
 */

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import {
  type FlatSearchItem,
  getResultUrl,
} from "@/lib/utils/global-search-utils";
import { useRouter } from "@/i18n/navigation";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  removeRecentSearch,
} from "@/lib/utils/search-recent";
import {
  getSearchOverlayState,
  SEARCH_OVERLAY_MIN_QUERY_LENGTH,
} from "@/lib/utils/search-overlay-state";

import { SearchOverlayEmptyState } from "./SearchOverlayEmptyState";
import { SearchOverlayInput } from "./SearchOverlayInput";
import { SearchOverlayLoginPrompt } from "./SearchOverlayLoginPrompt";
import { SearchOverlayResults } from "./SearchOverlayResults";

const MIN_QUERY_LENGTH = SEARCH_OVERLAY_MIN_QUERY_LENGTH;

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const t = useTranslations("globalSearch.overlay");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resultsId = useId();

  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen: hasResults,
    activeIndex,
    setActiveIndex,
    activeTab,
    availableTabs,
    selectTab,
    handleKeyDown: hookHandleKeyDown,
    flatItems,
  } = useGlobalSearch();

  // Recent searches state — kept in component state so removal/clear
  // updates immediately. Initialized to [] for SSR safety, then hydrated
  // from localStorage on mount.
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // ID of the IGDB game currently being imported (click → import → navigate).
  const [importingId, setImportingId] = useState<string | null>(null);

  // When a logged-out user tries to import an IGDB game, we prompt them to log
  // in instead of calling the route (which would 401). Issue #376.
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Hydrate recent searches when the overlay opens (avoids stale data
  // from a different tab session).
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(readRecentSearches());
    }
  }, [isOpen]);

  // Escape or a pointer down on the backdrop (outside the panel) closes; page
  // scroll locked, focus trapped in the panel and given to the input at open.
  useDismissableLayer(panelRef, {
    open: isOpen,
    onDismiss: onClose,
    lockScroll: true,
    trapFocus: true,
    initialFocusRef: inputRef,
  });

  // Reset the query when the overlay closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveIndex(-1);
      setShowLoginPrompt(false);
    }
  }, [isOpen, setQuery, setActiveIndex]);

  // ----------------------------------------------------------------------
  // Selection
  // ----------------------------------------------------------------------

  const persistAndNavigate = (url: string) => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      addRecentSearch(query);
    }
    onClose();
    router.push(url);
  };

  const handleItemSelect = async (item: FlatSearchItem) => {
    const url = getResultUrl(item);
    if (url) {
      persistAndNavigate(url);
      return;
    }

    // IGDB game not yet imported locally: import on click, then navigate to
    // its freshly created local page. Without this, the item click is a no-op.
    if (item.type === "game" && item.source === "igdb" && item.igdbId) {
      // Logged-out users cannot import (the route returns 401). Prompt them to
      // log in instead of calling it. Issue #376.
      if (!authLoading && !user) {
        setShowLoginPrompt(true);
        return;
      }
      if (importingId) return; // an import is already in flight
      setImportingId(item.id);
      try {
        const res = await fetch("/api/games/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ igdbId: item.igdbId }),
        });
        const data = await res.json();
        setImportingId(null);
        if (!res.ok) return;
        if (data.game?.slug) {
          persistAndNavigate(`/games/${data.game.slug}`);
        }
      } catch {
        setImportingId(null);
      }
    }
  };

  // ----------------------------------------------------------------------
  // Keyboard navigation on the input
  // ----------------------------------------------------------------------

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter: select the active item ourselves so IGDB games get imported
    // (the hook's own Enter handler no-ops on items without a direct URL).
    if (event.key === "Enter") {
      event.preventDefault();
      const item = flatItems[activeIndex];
      if (item) {
        void handleItemSelect(item);
      } else if (query.trim().length >= MIN_QUERY_LENGTH) {
        addRecentSearch(query);
      }
      return;
    }

    // Forward ↑↓ to the hook (uses flatItems to compute next index)
    hookHandleKeyDown(event);
  };

  // ----------------------------------------------------------------------
  // Recent searches helpers
  // ----------------------------------------------------------------------

  const onSelectRecent = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };
  const onRemoveRecent = (q: string) => {
    setRecentSearches(removeRecentSearch(q));
  };
  const onClearAllRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Navigate to the auth page from the login prompt (issue #376).
  const goToLogin = () => {
    onClose();
    router.push("/auth");
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------

  const { showResults, hasFetchedResults, isSearching, contentState } = getSearchOverlayState({
    hasResults,
    results,
    isLoading,
    query,
    recentCount: recentSearches.length,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogAriaLabel")}
      className="search-overlay"
      data-testid="search-overlay"
    >
      <div ref={panelRef} className="search-overlay-panel">
        <header className="search-overlay-header">
          <SearchOverlayInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            onKeyDown={handleInputKeyDown}
            isLoading={isLoading}
            resultsId={resultsId}
            isOpen={showResults && flatItems.length > 0}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeAriaLabel")}
            className="search-overlay-close"
          >
            <Icon icon="lucide:x" className="size-5" aria-hidden />
          </button>
        </header>

        <div
          id={resultsId}
          aria-live="polite"
          className="search-overlay-content"
          data-loading={isLoading || undefined}
          data-state={contentState}
        >
          {showLoginPrompt && <SearchOverlayLoginPrompt onLogin={goToLogin} />}
          {showResults && hasFetchedResults ? (
            <SearchOverlayResults
              results={results}
              activeIndex={activeIndex}
              query={query}
              onSelect={handleItemSelect}
              importingId={importingId}
              activeTab={activeTab}
              tabs={availableTabs}
              onTabChange={selectTab}
            />
          ) : isSearching ? (
            <div className="search-overlay-searching" role="status" aria-live="polite">
              <Icon
                icon="lucide:loader-2"
                className="search-overlay-searching-spinner size-6 animate-spin"
                aria-hidden
              />
              <span>{t("loading")}</span>
            </div>
          ) : (
            <SearchOverlayEmptyState
              recentSearches={recentSearches}
              onSelectRecent={onSelectRecent}
              onRemoveRecent={onRemoveRecent}
              onClearAll={onClearAllRecent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
