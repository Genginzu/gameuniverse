"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { NavLink, NavMembership } from "@/types/navigation";

import { MembershipAvatar } from "./MembershipAvatar";
import { NavCountBadge } from "./NavCountBadge";

interface EditorialMobileNavSectionProps {
  /** Unique id (prefixed public/private to avoid collisions). */
  id: string;
  label: string;
  icon: string;
  links: NavLink[];
  membership?: NavMembership | null;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

function MobileLink({ link, onNavigate }: { link: NavLink; onNavigate: () => void }) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={link.isActive ? "page" : undefined}
      className={`editorial-mobile-link ${link.isActive ? "is-active" : ""}`.trim()}
    >
      {link.imageUrl !== undefined ? (
        <MembershipAvatar link={link} />
      ) : (
        <Icon icon={link.icon} className="size-4" aria-hidden />
      )}
      <span className="truncate">{link.label}</span>
      <NavCountBadge badge={link.badge} />
    </Link>
  );
}

/** One accordion section of the mobile overlay: a Public Entry or a Space. */
export function EditorialMobileNavSection({
  id,
  label,
  icon,
  links,
  membership,
  isExpanded,
  onToggle,
  onNavigate,
}: EditorialMobileNavSectionProps) {
  const t = useTranslations("editorial.subSidebar");
  const listId = `editorial-mobile-section-${id}`;

  return (
    <section
      className={`editorial-mobile-section ${isExpanded ? "is-expanded" : ""}`.trim()}
      data-group={id}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={listId}
        className="editorial-mobile-section-trigger"
      >
        <span className="flex items-center gap-3">
          <Icon icon={icon} className="size-5" />
          <span>{label}</span>
        </span>
        <Icon
          icon="lucide:chevron-down"
          className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <ul id={listId} className="editorial-mobile-section-list">
          {links.map((link) => (
            <li key={link.href}>
              <MobileLink link={link} onNavigate={onNavigate} />
            </li>
          ))}
          {membership && <li aria-hidden className="border-editorial-line my-1 border-t" />}
          {membership?.isLoading && (
            <li className="text-editorial-muted px-3 py-2 text-sm">{t("loading")}</li>
          )}
          {membership?.links.map((link) => (
            <li key={link.href}>
              <MobileLink link={link} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
