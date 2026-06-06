"use client";

/**
 * EditorialMegaMenu : header full-width avec logo, 3 entrées principales
 * (Jeux / Personnages / Joueurs) qui ouvrent des panneaux au hover, et
 * 3 slots pour les composants de droite (search, language, user).
 *
 * - Ouverture au hover (delay 80ms) ou au clic
 * - Fermeture au mouseleave (delay 200ms), clic en dehors, Escape, ou clic
 *   sur un sous-lien
 * - Animation fade + translate-y 4px, 200ms ease-out
 * - Largeur du panel : pleine largeur header
 * - Underline néon sur l'entrée active (gradient secondary → primary), basé
 *   sur le pathname courant ou sur l'entrée dont le panel est ouvert
 * - Mobile (`< lg`) : entrées et panneaux cachés, le hamburger
 *   (`EditorialMobileNav`) prend le relais via `EditorialLayout`
 *
 * Voir docs/design/editorial-refonte-plan.md sections 5.1, 5.2, 5.3.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

// ============================================================================
// Data structure (exposed for tests & potential reuse)
// ============================================================================

export type MegaMenuEntryKey = "games" | "characters" | "players" | "esport";

export interface MegaMenuLink {
  /** Href without locale prefix. */
  href: string;
  /** i18n sub-key under `editorial.megaMenu.links.{entry}`. */
  labelKey: string;
  /** Iconify icon (`lucide:`, `fa:`, `mdi:`…). */
  icon: string;
}

export interface MegaMenuSection {
  /** i18n sub-key under `editorial.megaMenu.sections.{entry}`. */
  titleKey: string;
  links: MegaMenuLink[];
}

export interface MegaMenuEntry {
  key: MegaMenuEntryKey;
  /** Iconify icon shown next to the entry label. */
  icon: string;
  /** Path prefixes that mark this entry as active. */
  pathPrefixes: string[];
  sections: MegaMenuSection[];
}

/**
 * Top bar = **contenu public** uniquement. Tout ce qui est propre à
 * l'utilisateur connecté (bibliothèque, pronostics, coaching, compte) vit
 * dans le rail / la sub-sidebar (voir `EDITORIAL_SPACES`).
 */
export const EDITORIAL_MEGA_MENU_ENTRIES: readonly MegaMenuEntry[] = [
  {
    key: "games",
    icon: "fa:dice",
    pathPrefixes: ["/games", "/trending", "/upcoming"],
    sections: [
      {
        titleKey: "explore",
        links: [
          { href: "/games", labelKey: "all", icon: "lucide:gamepad-2" },
          { href: "/trending", labelKey: "trending", icon: "lucide:flame" },
          { href: "/upcoming", labelKey: "upcoming", icon: "lucide:calendar-clock" },
        ],
      },
    ],
  },
  {
    key: "characters",
    icon: "fa:user-ninja",
    pathPrefixes: ["/characters"],
    sections: [
      {
        titleKey: "explore",
        links: [{ href: "/characters", labelKey: "all", icon: "lucide:users-round" }],
      },
    ],
  },
  {
    key: "players",
    icon: "fa:user-friends",
    pathPrefixes: ["/players"],
    sections: [
      {
        titleKey: "community",
        links: [{ href: "/players", labelKey: "all", icon: "lucide:users" }],
      },
    ],
  },
  {
    key: "esport",
    icon: "fa:bolt",
    pathPrefixes: [
      "/esport/live",
      "/esport/calendar",
      "/esport/tournaments",
      "/esport/results",
      "/esport/teams",
      "/esport/players",
    ],
    sections: [
      {
        titleKey: "competitions",
        links: [
          { href: "/esport/live", labelKey: "live", icon: "lucide:radio" },
          { href: "/esport/calendar", labelKey: "calendar", icon: "lucide:calendar" },
          { href: "/esport/tournaments", labelKey: "tournaments", icon: "lucide:trophy" },
          { href: "/esport/results", labelKey: "results", icon: "lucide:list-checks" },
        ],
      },
      {
        titleKey: "proScene",
        links: [
          { href: "/esport/teams", labelKey: "teams", icon: "lucide:users" },
          { href: "/esport/players", labelKey: "proPlayers", icon: "lucide:gamepad-2" },
        ],
      },
    ],
  },
];

/** Returns the entry that matches the given pathname, or null. */
export function megaMenuEntryFromPathname(pathname: string | null): MegaMenuEntryKey | null {
  if (!pathname) return null;
  for (const entry of EDITORIAL_MEGA_MENU_ENTRIES) {
    for (const prefix of entry.pathPrefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return entry.key;
      }
    }
  }
  return null;
}

// ============================================================================
// Constants for hover delays
// ============================================================================

const OPEN_DELAY_MS = 80;
const CLOSE_DELAY_MS = 200;

// ============================================================================
// Component
// ============================================================================

interface EditorialMegaMenuProps {
  /** Slot rendered in the right zone (typically HeaderSearchTrigger). */
  searchSlot?: ReactNode;
  /** Slot rendered after the search slot (typically HeaderLanguageSwitcher). */
  languageSlot?: ReactNode;
  /** Slot rendered last on the right (typically a user dropdown). */
  userSlot?: ReactNode;
  className?: string;
}

export function EditorialMegaMenu({
  searchSlot,
  languageSlot,
  userSlot,
  className = "",
}: EditorialMegaMenuProps) {
  const pathname = usePathname();
  const t = useTranslations("editorial.megaMenu");
  const tEntries = useTranslations("editorial.megaMenu.entries");
  const tSections = useTranslations("editorial.megaMenu.sections");
  const tLinks = useTranslations("editorial.megaMenu.links");

  const [openEntry, setOpenEntry] = useState<MegaMenuEntryKey | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const activeEntry = useMemo<MegaMenuEntryKey | null>(() => {
    if (openEntry) return openEntry;
    return megaMenuEntryFromPathname(pathname);
  }, [openEntry, pathname]);

  const clearTimers = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleOpen = (key: MegaMenuEntryKey) => {
    clearTimers();
    openTimerRef.current = setTimeout(() => {
      setOpenEntry(key);
    }, OPEN_DELAY_MS);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => {
      setOpenEntry(null);
    }, CLOSE_DELAY_MS);
  };

  const closeImmediately = () => {
    clearTimers();
    setOpenEntry(null);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Escape closes
  useEffect(() => {
    if (!openEntry) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImmediately();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openEntry]);

  // Click outside closes
  useEffect(() => {
    if (!openEntry) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (navRef.current?.contains(target)) return;
      closeImmediately();
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [openEntry]);

  return (
    <div className={`editorial-mega-menu ${className}`.trim()}>
      <nav
        ref={navRef}
        aria-label={t("primaryNavAriaLabel")}
        className="editorial-mega-menu-bar"
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label={t("logoAriaLabel")}
          className="editorial-mega-menu-logo"
          onClick={closeImmediately}
        >
          <Icon icon="fa:gamepad" className="size-5" aria-hidden />
        </Link>

        {/* 3 entries (hidden under lg, mobile uses EditorialMobileNav) */}
        <ul className="editorial-mega-menu-entries hidden lg:flex">
          {EDITORIAL_MEGA_MENU_ENTRIES.map((entry) => {
            const isActive = activeEntry === entry.key;
            const isOpen = openEntry === entry.key;
            const label = tEntries(entry.key);
            return (
              <li
                key={entry.key}
                onMouseEnter={() => scheduleOpen(entry.key)}
                onMouseLeave={scheduleClose}
                className="editorial-mega-menu-entry-item"
              >
                <button
                  type="button"
                  onClick={() =>
                    isOpen ? closeImmediately() : setOpenEntry(entry.key)
                  }
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  className={`editorial-mega-menu-entry ${
                    isActive ? "is-active" : ""
                  }`.trim()}
                  data-entry={entry.key}
                >
                  <Icon icon={entry.icon} className="size-4" aria-hidden />
                  <span>{label}</span>
                  <Icon
                    icon="lucide:chevron-down"
                    className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Right zone: slots */}
        <div className="editorial-mega-menu-actions">
          {searchSlot && (
            <div className="editorial-mega-menu-action" data-slot="search">
              {searchSlot}
            </div>
          )}
          {languageSlot && (
            <div className="editorial-mega-menu-action" data-slot="language">
              {languageSlot}
            </div>
          )}
          {userSlot && (
            <div className="editorial-mega-menu-action" data-slot="user">
              {userSlot}
            </div>
          )}
        </div>
      </nav>

      {/* Mega panels — one per entry, displayed under the bar when open */}
      {EDITORIAL_MEGA_MENU_ENTRIES.map((entry) => {
        const isOpen = openEntry === entry.key;
        if (!isOpen) return null;
        const entryLabel = tEntries(entry.key);
        return (
          <div
            key={entry.key}
            role="region"
            aria-label={t("panel.ariaLabel", { entry: entryLabel })}
            data-entry={entry.key}
            className="editorial-mega-menu-panel"
            onMouseEnter={() => clearTimers()}
            onMouseLeave={scheduleClose}
          >
            <div className="editorial-mega-menu-panel-inner">
              {entry.sections.map((section) => (
                <div key={section.titleKey} className="editorial-mega-menu-section">
                  <h3 className="editorial-kicker editorial-mega-menu-section-title">
                    {tSections(`${entry.key}.${section.titleKey}`)}
                  </h3>
                  <ul className="editorial-mega-menu-section-links">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={closeImmediately}
                          className="editorial-mega-menu-link"
                        >
                          <Icon icon={link.icon} className="size-4" aria-hidden />
                          <span>{tLinks(`${entry.key}.${link.labelKey}`)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
