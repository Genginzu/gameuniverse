"use client";

/**
 * EditorialMobileNav : bouton hamburger + overlay full-screen mobile.
 *
 * Sur mobile (< lg), le rail vertical et la sub-sidebar (F0-08, F0-09)
 * sont cachés, remplacés par ce composant. Au clic sur le hamburger,
 * un overlay plein écran s'ouvre avec un accordéon des 5 spaces. Chaque
 * space déplie ses liens.
 *
 * - Body scroll lock pendant que l'overlay est ouvert
 * - Fermeture : Escape, ╳, clic sur un lien
 * - Pas de backdrop-blur (refonte éditoriale)
 * - Tous les libellés visibles passent par next-intl
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import {
  EDITORIAL_SPACES,
  type EditorialSpaceKey,
} from "./EditorialRail";

interface EditorialMobileNavProps {
  /** Classe additionnelle pour le bouton hamburger. */
  className?: string;
}

export function EditorialMobileNav({ className = "" }: EditorialMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSpace, setExpandedSpace] = useState<EditorialSpaceKey | null>(null);
  const pathname = usePathname();
  const t = useTranslations("editorial");

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setExpandedSpace(null);
  };

  // Escape closes the overlay
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Body scroll lock while open
  useEffect(() => {
    if (!isOpen) return;
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={t("mobileNav.openAriaLabel")}
        aria-expanded={isOpen}
        aria-controls="editorial-mobile-nav-overlay"
        className={`editorial-mobile-toggle ${className}`.trim()}
      >
        <Icon icon="fa:bars" className="size-5" />
      </button>

      {isOpen && (
        <div
          id="editorial-mobile-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("mobileNav.dialogAriaLabel")}
          className="editorial-mobile-overlay"
        >
          <header className="editorial-mobile-overlay-header">
            <span className="editorial-display text-xl text-white">
              {t("mobileNav.title")}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label={t("mobileNav.closeAriaLabel")}
              className="editorial-mobile-overlay-close"
            >
              <Icon icon="lucide:x" className="size-5" />
            </button>
          </header>

          <nav
            aria-label={t("mobileNav.spacesAriaLabel")}
            className="editorial-mobile-overlay-nav"
          >
            {EDITORIAL_SPACES.map((space) => {
              const isExpanded = expandedSpace === space.key;
              const spaceLabel = t(`spaces.${space.key}`);
              return (
                <section
                  key={space.key}
                  className={`editorial-mobile-section ${isExpanded ? "is-expanded" : ""}`.trim()}
                  data-space={space.key}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSpace((current) => (current === space.key ? null : space.key))
                    }
                    aria-expanded={isExpanded}
                    aria-controls={`editorial-mobile-section-${space.key}`}
                    className="editorial-mobile-section-trigger"
                  >
                    <span className="flex items-center gap-3">
                      <Icon icon={space.icon} className="size-5" />
                      <span>{spaceLabel}</span>
                    </span>
                    <Icon
                      icon="lucide:chevron-down"
                      className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <ul
                      id={`editorial-mobile-section-${space.key}`}
                      className="editorial-mobile-section-list"
                    >
                      {space.links.map((link) => {
                        const active = pathname === link.href;
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={close}
                              aria-current={active ? "page" : undefined}
                              className={`editorial-mobile-link ${active ? "is-active" : ""}`.trim()}
                            >
                              {t(`links.${space.key}.${link.labelKey}`)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
