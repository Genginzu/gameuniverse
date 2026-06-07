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
 * - Navigation clavier : ↑↓ (entre items), Enter (sélection), Escape (close)
 * - Body scroll lock pendant l'ouverture
 * - Fermeture : ╳, Escape, clic backdrop, ou sélection d'un résultat
 *
 * Voir docs/design/editorial-refonte-plan.md section 5.6.
 */

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useGlobalSearch } from "@/hooks/useGlobalSearch";
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

import { SearchOverlayEmptyState } from "./SearchOverlayEmptyState";
import { SearchOverlayInput } from "./SearchOverlayInput";
import { SearchOverlayResults } from "./SearchOverlayResults";

const MIN_QUERY_LENGTH = 2;

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const t = useTranslations("globalSearch.overlay");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const resultsId = useId();

  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen: hasResults,
    activeIndex,
    setActiveIndex,
    handleKeyDown: hookHandleKeyDown,
    flatItems,
  } = useGlobalSearch();

  // Recent searches state — kept in component state so removal/clear
  // updates immediately. Initialized to [] for SSR safety, then hydrated
  // from localStorage on mount.
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Hydrate recent searches when the overlay opens (avoids stale data
  // from a different tab session).
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(readRecentSearches());
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Auto-focus the input when the overlay opens
  useEffect(() => {
    if (!isOpen) return;
    // Slight delay to let the dialog render before focusing (avoids edge
    // cases where the focus would jump to a transitioning element).
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  // Reset the query when the overlay closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveIndex(-1);
    }
  }, [isOpen, setQuery, setActiveIndex]);

  // Global Escape — closes the overlay even if focus is outside the input
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ----------------------------------------------------------------------
  // Selection
  // ----------------------------------------------------------------------

  const persistAndNavigate = (item: FlatSearchItem) => {
    const url = getResultUrl(item);
    if (!url) return; // IGDB game without local import — ignored for now
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      addRecentSearch(query);
    }
    onClose();
    router.push(url);
  };

  const handleItemSelect = (item: FlatSearchItem) => {
    persistAndNavigate(item);
  };

  // ----------------------------------------------------------------------
  // Keyboard navigation on the input
  // ----------------------------------------------------------------------

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    // Forward ↑↓/Enter to the hook (uses flatItems to compute next index)
    hookHandleKeyDown(event);
    // If Enter was pressed and the hook navigated us, hookHandleKeyDown will
    // have set isOpen=false. We can't easily intercept that here; instead
    // we add our own Enter handler when no item is active to also persist
    // the query into recent searches even without selection.
    if (
      event.key === "Enter" &&
      activeIndex < 0 &&
      query.trim().length >= MIN_QUERY_LENGTH
    ) {
      addRecentSearch(query);
    }
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

  // ----------------------------------------------------------------------
  // Backdrop click — closes only when the click is outside the dialog body
  // ----------------------------------------------------------------------

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------

  const showResults = useMemo(
    () => hasResults && query.trim().length >= MIN_QUERY_LENGTH,
    [hasResults, query]
  );

  // `hasResults` (alias de `isOpen` du hook) bascule à `true` dès que la
  // query atteint MIN_QUERY_LENGTH, *avant* que le fetch ne soit terminé.
  // On distingue donc deux cas :
  //   1. `results === null` → on est en train de chercher (fetch en cours
  //      ou pas encore renvoyé) → afficher le placeholder spinner.
  //   2. `results !== null` → afficher la liste (qui peut être vide → le
  //      composant Results gère le « Aucun résultat »).
  const hasFetchedResults = results !== null;
  const isSearching = useMemo(
    () =>
      !hasFetchedResults &&
      isLoading &&
      query.trim().length >= MIN_QUERY_LENGTH,
    [hasFetchedResults, isLoading, query]
  );

  // État qui détermine le styling du container : avec border+bg ("filled")
  // pour les listes (résultats, récents) et "loading", ou bien sans
  // (juste le hint centré "Commencez à saisir…") pour ne pas laisser un
  // panneau vide quand il n'y a rien à montrer.
  const contentState: "results" | "loading" | "recent" | "hint" =
    showResults && hasFetchedResults
      ? "results"
      : isSearching
        ? "loading"
        : recentSearches.length > 0
          ? "recent"
          : "hint";

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogAriaLabel")}
      onMouseDown={handleBackdropClick}
      className="search-overlay"
      data-testid="search-overlay"
    >
      <div className="search-overlay-panel">
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
          {showResults && hasFetchedResults ? (
            <SearchOverlayResults
              results={results}
              activeIndex={activeIndex}
              query={query}
              onSelect={handleItemSelect}
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
