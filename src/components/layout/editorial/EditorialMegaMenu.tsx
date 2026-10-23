"use client";

/**
 * EditorialMegaMenu : header full-width avec logo, les Public Entries du
 * Navigation Model (Jeux / Personnages / Joueurs / E-sport) qui ouvrent des
 * panneaux au hover, et des slots pour les composants de droite.
 *
 * - Ouverture au hover (delay 80ms) ou au clic
 * - Fermeture au mouseleave (delay 200ms), clic en dehors, Escape, ou clic
 *   sur un sous-lien
 * - Underline néon sur l'entrée active (Active Entry du modèle, ou l'entrée
 *   dont le panel est ouvert)
 * - Mobile (`< lg`) : entrées et panneaux cachés, le hamburger
 *   (`EditorialMobileNav`) prend le relais via `EditorialLayout`
 *
 * Entrées, libellés et état actif viennent de `useEditorialNavigation()`.
 *
 * Voir docs/design/editorial-refonte-plan.md sections 5.1, 5.2, 5.3.
 */

import { useRef, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { useEditorialNavigation } from "@/hooks/useEditorialNavigation";
import { useMegaMenuHover } from "@/hooks/useMegaMenuHover";

import { EditorialMegaMenuPanel } from "./EditorialMegaMenuPanel";

interface EditorialMegaMenuProps {
  /** Slot rendered in the right zone (typically HeaderSearchTrigger). */
  searchSlot?: ReactNode;
  /** Slot rendered after the search slot (typically HeaderLanguageSwitcher). */
  languageSlot?: ReactNode;
  /** Slot rendered before the user slot (typically NotificationBell). */
  notificationSlot?: ReactNode;
  /** Slot rendered last on the right (typically a user dropdown). */
  userSlot?: ReactNode;
  className?: string;
}

export function EditorialMegaMenu({
  searchSlot,
  languageSlot,
  notificationSlot,
  userSlot,
  className = "",
}: EditorialMegaMenuProps) {
  const t = useTranslations("editorial.megaMenu");
  const { publicEntries, activeEntryKey } = useEditorialNavigation();
  const menu = useMegaMenuHover();
  const { openEntry, closeImmediately } = menu;
  const navRef = useRef<HTMLDivElement>(null);

  const highlightedEntry = openEntry ?? activeEntryKey;

  // Escape, or a pointer down outside the whole navigation bar, closes.
  useDismissableLayer(navRef, { open: openEntry !== null, onDismiss: closeImmediately });

  const slots: Array<[string, ReactNode]> = [
    ["search", searchSlot],
    ["language", languageSlot],
    ["notification", notificationSlot],
    ["user", userSlot],
  ];
  const openPanel = publicEntries.find((entry) => entry.key === openEntry);

  return (
    <div ref={navRef} className={`editorial-mega-menu ${className}`.trim()}>
      <nav aria-label={t("primaryNavAriaLabel")} className="editorial-mega-menu-bar">
        <Link
          href="/"
          aria-label={t("logoAriaLabel")}
          className="editorial-mega-menu-logo"
          onClick={closeImmediately}
        >
          <Icon icon="fa:gamepad" className="size-5" aria-hidden />
        </Link>

        {/* Entries (hidden under lg, mobile uses EditorialMobileNav) */}
        <ul className="editorial-mega-menu-entries hidden lg:flex">
          {publicEntries.map((entry) => {
            const isActive = highlightedEntry === entry.key;
            const isOpen = openEntry === entry.key;
            return (
              <li
                key={entry.key}
                onMouseEnter={() => menu.scheduleOpen(entry.key)}
                onMouseLeave={menu.scheduleClose}
                className="editorial-mega-menu-entry-item"
              >
                <button
                  type="button"
                  onClick={() => (isOpen ? closeImmediately() : menu.setOpenEntry(entry.key))}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  className={`editorial-mega-menu-entry ${isActive ? "is-active" : ""}`.trim()}
                  data-entry={entry.key}
                >
                  <Icon icon={entry.icon} className="size-4" aria-hidden />
                  <span>{entry.label}</span>
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

        <div className="editorial-mega-menu-actions">
          {slots.map(([name, slot]) =>
            slot ? (
              <div key={name} className="editorial-mega-menu-action" data-slot={name}>
                {slot}
              </div>
            ) : null
          )}
        </div>
      </nav>

      {openPanel && (
        <EditorialMegaMenuPanel
          entry={openPanel}
          onKeepOpen={menu.clearTimers}
          onLeave={menu.scheduleClose}
          onNavigate={closeImmediately}
        />
      )}
    </div>
  );
}
