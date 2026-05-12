"use client";

/**
 * EditorialMobileNav : bouton hamburger + overlay full-screen mobile.
 *
 * Sur mobile (< lg), le rail vertical et la sub-sidebar (F0-08, F0-09)
 * sont cachés, remplacés par ce composant. Au clic sur le hamburger,
 * un overlay plein écran s'ouvre avec un accordéon des 5 spaces. Chaque
 * space déplie ses liens. Une section "Compte" en bas regroupe les
 * actions utilisateur (Profile / Library / Settings / Sign out, ou
 * Sign in si non connecté). Voir issue #264.
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
import { useAuth } from "@/hooks/useAuth";

import {
  EDITORIAL_SPACES,
  type EditorialSpaceKey,
} from "./EditorialRail";

interface EditorialMobileNavProps {
  /** Classe additionnelle pour le bouton hamburger. */
  className?: string;
}

interface AccountLink {
  href: string;
  labelKey: "profile" | "library" | "settings";
  icon: string;
}

const ACCOUNT_LINKS: readonly AccountLink[] = [
  { href: "/profile", labelKey: "profile", icon: "lucide:user" },
  { href: "/library", labelKey: "library", icon: "lucide:library" },
  { href: "/settings", labelKey: "settings", icon: "lucide:settings" },
];

export function EditorialMobileNav({ className = "" }: EditorialMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSpace, setExpandedSpace] = useState<EditorialSpaceKey | null>(null);
  const pathname = usePathname();
  const t = useTranslations("editorial");
  const tAccount = useTranslations("editorial.mobileNav.account");
  const { user, loading, signOut } = useAuth();

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

          {!loading && (
            <section
              aria-label={tAccount("title")}
              className="editorial-mobile-account"
              data-testid="editorial-mobile-account"
            >
              <h2 className="editorial-mobile-account-title">{tAccount("title")}</h2>

              {user ? (
                <ul className="editorial-mobile-account-list">
                  {ACCOUNT_LINKS.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={`editorial-mobile-account-link ${active ? "is-active" : ""}`.trim()}
                          data-testid={`editorial-mobile-account-${link.labelKey}`}
                        >
                          <Icon icon={link.icon} className="size-4" aria-hidden />
                          <span>{tAccount(link.labelKey)}</span>
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      type="button"
                      onClick={async () => {
                        close();
                        await signOut();
                      }}
                      className="editorial-mobile-account-link editorial-mobile-account-link-danger"
                      data-testid="editorial-mobile-account-signout"
                    >
                      <Icon icon="lucide:log-out" className="size-4" aria-hidden />
                      <span>{tAccount("signOut")}</span>
                    </button>
                  </li>
                </ul>
              ) : (
                <Link
                  href="/auth"
                  onClick={close}
                  className="editorial-mobile-account-cta"
                  data-testid="editorial-mobile-account-signin"
                >
                  <Icon icon="lucide:log-in" className="size-4" aria-hidden />
                  <span>{tAccount("signIn")}</span>
                </Link>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}
