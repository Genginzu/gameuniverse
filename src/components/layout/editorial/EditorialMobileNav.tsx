"use client";

/**
 * EditorialMobileNav : bouton hamburger + overlay full-screen mobile.
 *
 * Sur mobile (< lg), la top bar (`EditorialMegaMenu`, public) **et** le rail
 * vertical + sub-sidebar (privé, propre à l'utilisateur connecté) sont cachés.
 * Cet overlay prend donc le relais pour les deux : il expose un accordéon des
 * espaces publics ("Découvrir") puis des espaces utilisateur ("Mon espace"),
 * et une section "Compte" en bas (Profile / Library / Settings / Sign out, ou
 * Sign in si non connecté).
 *
 * - Body scroll lock pendant que l'overlay est ouvert
 * - Fermeture : Escape, ╳, clic sur un lien
 * - Pas de backdrop-blur (refonte éditoriale)
 * - Tous les libellés visibles passent par next-intl
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";

import { EDITORIAL_MEGA_MENU_ENTRIES } from "./EditorialMegaMenu";
import { EDITORIAL_SPACES } from "./EditorialRail";

interface EditorialMobileNavProps {
  /** Classe additionnelle pour le bouton hamburger. */
  className?: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface NavGroup {
  /** Identifiant unique (préfixé public/privé pour éviter les collisions). */
  id: string;
  label: string;
  icon: string;
  links: NavLink[];
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pathname = usePathname();
  const t = useTranslations("editorial");
  const tAccount = useTranslations("editorial.mobileNav.account");
  const { user, loading, signOut } = useAuth();

  // Public groups (top bar) : sections aplaties en une liste de liens.
  const publicGroups = useMemo<NavGroup[]>(
    () =>
      EDITORIAL_MEGA_MENU_ENTRIES.map((entry) => ({
        id: `public-${entry.key}`,
        label: t(`megaMenu.entries.${entry.key}`),
        icon: entry.icon,
        links: entry.sections
          .flatMap((section) => section.links)
          .map((link) => ({
            href: link.href,
            label: t(`megaMenu.links.${entry.key}.${link.labelKey}`),
            icon: link.icon,
          })),
      })),
    [t]
  );

  // Private groups (rail) : contenu propre à l'utilisateur connecté.
  const privateGroups = useMemo<NavGroup[]>(
    () =>
      EDITORIAL_SPACES.map((space) => ({
        id: `private-${space.key}`,
        label: t(`spaces.${space.key}`),
        icon: space.icon,
        links: space.links.map((link) => ({
          href: link.href,
          label: t(`links.${space.key}.${link.labelKey}`),
          icon: link.icon,
        })),
      })),
    [t]
  );

  const close = () => {
    setIsOpen(false);
    setExpandedId(null);
  };

  // Escape closes the overlay
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
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

  const renderGroups = (groups: NavGroup[]) =>
    groups.map((group) => {
      const isExpanded = expandedId === group.id;
      return (
        <section
          key={group.id}
          className={`editorial-mobile-section ${isExpanded ? "is-expanded" : ""}`.trim()}
          data-group={group.id}
        >
          <button
            type="button"
            onClick={() => setExpandedId((current) => (current === group.id ? null : group.id))}
            aria-expanded={isExpanded}
            aria-controls={`editorial-mobile-section-${group.id}`}
            className="editorial-mobile-section-trigger"
          >
            <span className="flex items-center gap-3">
              <Icon icon={group.icon} className="size-5" />
              <span>{group.label}</span>
            </span>
            <Icon
              icon="lucide:chevron-down"
              className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {isExpanded && (
            <ul id={`editorial-mobile-section-${group.id}`} className="editorial-mobile-section-list">
              {group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`editorial-mobile-link ${active ? "is-active" : ""}`.trim()}
                    >
                      <Icon icon={link.icon} className="size-4" aria-hidden />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      );
    });

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
              {renderGroups(publicGroups)}
            </nav>

            <nav aria-label={t("mobileNav.myAreaTitle")}>
              <h2 className="editorial-mobile-group-title">{t("mobileNav.myAreaTitle")}</h2>
              {renderGroups(privateGroups)}
            </nav>
          </div>

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
