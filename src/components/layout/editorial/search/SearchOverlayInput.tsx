"use client";

/**
 * SearchOverlayInput : input XL au sommet de l'overlay, avec icône loupe à
 * gauche, bouton "clear" à droite (visible quand la query n'est pas vide),
 * et spinner de chargement intégré au input lui-même.
 *
 * - Auto-focus à l'ouverture (géré par le parent via `inputRef`)
 * - Touche Escape transmise via `onKeyDown` (le parent ferme l'overlay)
 * - `aria-controls` pointe vers la liste des résultats pour l'a11y
 */

import { Icon } from "@iconify/react";
import { forwardRef, type KeyboardEvent, type Ref } from "react";
import { useTranslations } from "next-intl";

interface SearchOverlayInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  /** ID de la liste des résultats pour `aria-controls`. */
  resultsId: string;
  /** Indique si l'overlay des résultats est ouvert (aria-expanded). */
  isOpen: boolean;
}

export const SearchOverlayInput = forwardRef<HTMLInputElement, SearchOverlayInputProps>(
  function SearchOverlayInput(
    { value, onChange, onKeyDown, isLoading, resultsId, isOpen }: SearchOverlayInputProps,
    ref: Ref<HTMLInputElement>
  ) {
    const t = useTranslations("globalSearch.overlay");

    return (
      <div className="search-overlay-input-wrapper" data-loading={isLoading}>
        <Icon
          icon="mdi:magnify"
          className="search-overlay-input-icon"
          aria-hidden
        />
        <input
          ref={ref}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={resultsId}
          aria-autocomplete="list"
          aria-label={t("inputAriaLabel")}
          placeholder={t("inputPlaceholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="search-overlay-input"
          data-testid="search-overlay-input"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("clearAriaLabel")}
            className="search-overlay-input-clear"
          >
            <Icon icon="lucide:x" className="size-4" aria-hidden />
          </button>
        )}
        {isLoading && (
          <span className="search-overlay-input-spinner" aria-hidden>
            <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
            <span className="sr-only">{t("loading")}</span>
          </span>
        )}
      </div>
    );
  }
);
