"use client";

/**
 * EditorialMobileNav : bouton hamburger + overlay full-screen mobile.
 *
 * Sur mobile (< lg), la top bar (`EditorialMegaMenu`) **et** le rail +
 * sub-sidebar sont cachés. Cet overlay rend donc tout le Navigation Model :
 * accordéon des Public Entries ("Découvrir"), puis des Spaces avec leurs
 * Membership Links ("Mon espace"), et la section "Compte" en bas.
 *
 * - Body scroll lock + focus trap pendant que l'overlay est ouvert
 * - Fermeture : Escape, ╳, clic sur un lien
 * - Pas de backdrop-blur (refonte éditoriale)
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useCallback, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { useEditorialNavigation } from "@/hooks/useEditorialNavigation";

import { EditorialMobileNavAccount } from "./EditorialMobileNavAccount";
import { EditorialMobileNavSection } from "./EditorialMobileNavSection";

interface EditorialMobileNavProps {
  /** Classe additionnelle pour le bouton hamburger. */
  className?: string;
}

export function EditorialMobileNav({ className = "" }: EditorialMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = useTranslations("editorial");
  const { publicEntries, spaces, account } = useEditorialNavigation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setExpandedId(null);
  }, []);
  // Escape closes; scroll locked and focus trapped while the overlay is open.
  useDismissableLayer(overlayRef, {
    open: isOpen,
    onDismiss: close,
    insideRefs: [toggleRef],
    lockScroll: true,
    trapFocus: true,
  });

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("mobileNav.openAriaLabel")}
        aria-expanded={isOpen}
        aria-controls="editorial-mobile-nav-overlay"
        className={`editorial-mobile-toggle ${className}`.trim()}
      >
        <Icon icon="fa:bars" className="size-5" />
      </button>

      {isOpen && (
        <div
          ref={overlayRef}
          id="editorial-mobile-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("mobileNav.dialogAriaLabel")}
          className="editorial-mobile-overlay"
        >
          <header className="editorial-mobile-overlay-header">
            <span className="editorial-display text-xl text-white">{t("mobileNav.title")}</span>
            <button
              type="button"
              onClick={close}
              aria-label={t("mobileNav.closeAriaLabel")}
              className="editorial-mobile-overlay-close"
            >
              <Icon icon="lucide:x" className="size-5" />
            </button>
          </header>

          <div className="editorial-mobile-overlay-nav">
            <nav aria-label={t("mobileNav.discoverTitle")}>
              <h2 className="editorial-mobile-group-title">{t("mobileNav.discoverTitle")}</h2>
              {publicEntries.map((entry) => (
                <EditorialMobileNavSection
                  key={entry.key}
                  id={`public-${entry.key}`}
                  label={entry.label}
                  icon={entry.icon}
                  links={entry.sections.flatMap((section) => section.links)}
                  isExpanded={expandedId === `public-${entry.key}`}
                  onToggle={() => toggle(`public-${entry.key}`)}
                  onNavigate={close}
                />
              ))}
            </nav>

            <nav aria-label={t("mobileNav.myAreaTitle")}>
              <h2 className="editorial-mobile-group-title">{t("mobileNav.myAreaTitle")}</h2>
              {spaces.map((space) => (
                <EditorialMobileNavSection
                  key={space.key}
                  id={`private-${space.key}`}
                  label={space.label}
                  icon={space.icon}
                  links={space.links}
                  membership={space.membership}
                  isExpanded={expandedId === `private-${space.key}`}
                  onToggle={() => toggle(`private-${space.key}`)}
                  onNavigate={close}
                />
              ))}
            </nav>
          </div>

          <EditorialMobileNavAccount links={account} onNavigate={close} />
        </div>
      )}
    </>
  );
}
