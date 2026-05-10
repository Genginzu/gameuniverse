"use client";

/**
 * HeaderSearchTrigger : trigger compact de la recherche dans le header.
 *
 * Ce composant est **volontairement** un simple trigger visuel — pas un input
 * fonctionnel. Toute la saisie et l'affichage des résultats se feront dans
 * l'overlay full-page (F0-07c). Au clic, focus, ou raccourci clavier
 * `Ctrl+K` / `Cmd+K`, le composant appelle `onActivate` et le parent
 * (l'EditorialMegaMenu) ouvre l'overlay.
 *
 * - 240px sur desktop, icône seule sur tablet/mobile (< md)
 * - Loupe à gauche, placeholder traduit, badge `Ctrl K` à droite (>= md)
 * - Le raccourci global est ignoré quand le focus est dans un input/textarea
 *   ou un élément contenteditable (pas de capture intempestive en saisie).
 *
 * Voir docs/design/editorial-refonte-plan.md section 5.4.
 */

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface HeaderSearchTriggerProps {
  /** Appelé au clic, focus, ou Ctrl/Cmd+K. */
  onActivate: () => void;
  /** Classe additionnelle. */
  className?: string;
  /**
   * Désactive le raccourci global. Utile pour les sous-arbres où Ctrl+K
   * a déjà une autre signification (rare).
   */
  disableShortcut?: boolean;
}

export function HeaderSearchTrigger({
  onActivate,
  className = "",
  disableShortcut = false,
}: HeaderSearchTriggerProps) {
  const t = useTranslations("globalSearch.trigger");

  // Raccourci global Ctrl+K / Cmd+K
  useEffect(() => {
    if (disableShortcut) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "k";
      if (!isShortcut) return;

      // Ne pas capturer quand l'utilisateur tape dans un input/textarea/contenteditable
      const target = event.target as HTMLElement | null;
      if (target && typeof (target as HTMLElement).tagName === "string" && isEditableElement(target)) return;

      event.preventDefault();
      onActivate();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onActivate, disableShortcut]);

  return (
    <button
      type="button"
      onClick={onActivate}
      onFocus={onActivate}
      aria-label={t("ariaLabel")}
      aria-haspopup="dialog"
      className={`header-search-trigger ${className}`.trim()}
      data-testid="header-search-trigger"
    >
      <Icon icon="mdi:magnify" className="size-4 shrink-0" aria-hidden />
      <span className="header-search-trigger-placeholder hidden md:inline">
        {t("placeholder")}
      </span>
      <span className="header-search-trigger-shortcut hidden md:inline" aria-hidden>
        {t("shortcutHint")}
      </span>
    </button>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function isEditableElement(element: HTMLElement): boolean {
  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (element.isContentEditable) return true;
  // Fallback: some environments (e.g. jsdom) don't propagate isContentEditable
  // when the attribute is set declaratively via JSX.
  const attr = element.getAttribute("contenteditable");
  if (attr === "" || attr === "true") return true;
  return false;
}
