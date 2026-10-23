"use client";

/**
 * EditorialMobileNav : bouton hamburger + overlay full-screen mobile.
 *
 * Sur mobile (< lg), la top bar (`EditorialMegaMenu`) **et** le rail +
 * sub-sidebar sont cachés. Cet overlay rend donc tout le Navigation Model :
 * accordéon des Public Entries ("Découvrir"), puis des Spaces avec leurs
 * Membership Links ("Mon espace"), et la section "Compte" en bas.
 *
 * - Body scroll lock pendant que l'overlay est ouvert
 * - Fermeture : Escape, ╳, clic sur un lien
 * - Pas de backdrop-blur (refonte éditoriale)
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useEditorialNavigation } from "@/hooks/useEditorialNavigation";

import { EditorialMobileNavAccount } from "./EditorialMobileNavAccount";
import { EditorialMobileNavSection } from "./EditorialMobileNavSection";

interface EditorialMobileNavProps {
  /** Classe additionnelle pour le bouton hamburger. */
  className?: string;
}

function useOverlayEffects(isOpen: boolean, close: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);
}

export function EditorialMobileNav({ className = "" }: EditorialMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = useTranslations("editorial");
  const { publicEntries, spaces, account } = useEditorialNavigation();

  const close = useCallback(() => {
    setIsOpen(false);
    setExpandedId(null);
  }, []);
  useOverlayEffects(isOpen, close);

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <>
      <button
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
