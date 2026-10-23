"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { NavPublicEntry } from "@/types/navigation";

interface EditorialMegaMenuPanelProps {
  entry: NavPublicEntry;
  onKeepOpen: () => void;
  onLeave: () => void;
  onNavigate: () => void;
}

/** Panel of one Public Entry, displayed under the mega-menu bar when open. */
export function EditorialMegaMenuPanel({
  entry,
  onKeepOpen,
  onLeave,
  onNavigate,
}: EditorialMegaMenuPanelProps) {
  const t = useTranslations("editorial.megaMenu");
  return (
    <div
      role="region"
      aria-label={t("panel.ariaLabel", { entry: entry.label })}
      data-entry={entry.key}
      className="editorial-mega-menu-panel"
      onMouseEnter={onKeepOpen}
      onMouseLeave={onLeave}
    >
      <div className="editorial-mega-menu-panel-inner">
        {entry.sections.map((section) => (
          <div key={section.key} className="editorial-mega-menu-section">
            <h3 className="editorial-kicker editorial-mega-menu-section-title">{section.title}</h3>
            <ul className="editorial-mega-menu-section-links">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={onNavigate} className="editorial-mega-menu-link">
                    <Icon icon={link.icon} className="size-4" aria-hidden />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
