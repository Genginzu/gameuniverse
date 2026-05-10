"use client";

/**
 * EditorialSubSidebar : panneau secondaire 220px qui glisse depuis la
 * gauche, à droite du rail (F0-08). Affiche les liens d'un espace
 * (Games, Esport, Library, Community, Coaching).
 *
 * Comportement :
 * - Slide-in de 220px (animation CSS) quand `space` est non-null
 * - Largeur 0 + retiré du flux quand `space` est null
 * - Fermeture sur Escape, clic en dehors, ou clic sur un lien
 * - Indicateur visuel sur le lien actif (basé sur le pathname courant)
 * - Pas de backdrop-blur (refonte éditoriale)
 *
 * L'état d'ouverture est géré par le parent via `useEditorialRailState`
 * (ce composant est purement contrôlé).
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

import { Link, usePathname } from "@/i18n/navigation";

import type { EditorialSpace } from "./EditorialRail";

interface EditorialSubSidebarProps {
  /** Space affiché. `null` = fermée. */
  space: EditorialSpace | null;
  /** Callback de fermeture (Escape, ╳, clic en dehors). */
  onClose: () => void;
  /**
   * Si `true`, ferme aussi au clic sur un lien (UX standard).
   * Activé par défaut pour la navigation desktop.
   */
  closeOnNavigate?: boolean;
}

export function EditorialSubSidebar({
  space,
  onClose,
  closeOnNavigate = true,
}: EditorialSubSidebarProps) {
  const isOpen = space !== null;
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside closes
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const aside = asideRef.current;
      if (!aside || !target) return;
      if (aside.contains(target)) return;
      // Aussi ignorer les clics sur le rail (le toggle gère sa propre logique)
      const rail = document.querySelector(".editorial-rail");
      if (rail && rail.contains(target)) return;
      onClose();
    };
    // Utilise pointerdown pour réagir avant que le focus change
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  return (
    <aside
      ref={asideRef}
      aria-label={space ? `${space.label} navigation` : undefined}
      aria-hidden={!isOpen}
      className={`editorial-sub-sidebar ${isOpen ? "is-open" : ""}`.trim()}
      data-space={space?.key}
    >
      {space && (
        <div className="editorial-sub-sidebar-inner">
          <header className="editorial-sub-sidebar-header">
            <h2 className="editorial-display text-lg text-white">{space.label}</h2>
            <button
              type="button"
              onClick={onClose}
              className="editorial-sub-sidebar-close"
              aria-label="Close sub-sidebar"
            >
              <Icon icon="lucide:x" className="size-4" />
            </button>
          </header>

          <nav aria-label={`${space.label} links`} className="editorial-sub-sidebar-nav">
            {space.links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`editorial-sub-sidebar-link ${active ? "is-active" : ""}`.trim()}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    if (closeOnNavigate) {
                      onClose();
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </aside>
  );
}
