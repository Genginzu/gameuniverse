"use client";

/**
 * EditorialSubSidebar : panneau secondaire 220px qui glisse depuis la
 * gauche, à droite du rail (F0-08). Affiche les liens d'un Space, puis ses
 * Membership Links (mes groupes / mes communautés).
 *
 * Comportement :
 * - Slide-in de 220px (animation CSS) quand `spaceKey` est non-null
 * - Largeur 0 + retiré du flux quand `spaceKey` est null
 * - Fermeture sur Escape, clic en dehors, ou clic sur un lien
 * - Pas de backdrop-blur (refonte éditoriale)
 *
 * Pure mise en page : liens, libellés et état actif viennent de
 * `useEditorialNavigation()`. L'état d'ouverture est géré par le parent via
 * `useEditorialRailState`.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useRef, type RefObject } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { useEditorialNavigation } from "@/hooks/useEditorialNavigation";
import type { NavSpaceKey } from "@/types/navigation";

import { MembershipAvatar } from "./MembershipAvatar";
import { NavCountBadge } from "./NavCountBadge";

interface EditorialSubSidebarProps {
  /** Space affiché. `null` = fermée. */
  spaceKey: NavSpaceKey | null;
  /** Callback de fermeture (Escape, ╳, clic en dehors). */
  onClose: () => void;
  /**
   * Si `true`, ferme aussi au clic sur un lien (UX standard).
   * Activé par défaut pour la navigation desktop.
   */
  closeOnNavigate?: boolean;
  /** Inside regions besides the sub-sidebar itself (the rail). */
  insideRefs?: ReadonlyArray<RefObject<HTMLElement | null>>;
}

export function EditorialSubSidebar({
  spaceKey,
  onClose,
  closeOnNavigate = true,
  insideRefs,
}: EditorialSubSidebarProps) {
  const t = useTranslations("editorial");
  const { spaces } = useEditorialNavigation();
  const space = spaceKey ? (spaces.find((s) => s.key === spaceKey) ?? null) : null;
  const isOpen = space !== null;
  const asideRef = useRef<HTMLElement>(null);

  // Escape, or a pointer down outside the sub-sidebar and the rail (the rail
  // toggle handles its own open/close logic).
  useDismissableLayer(asideRef, { open: isOpen, onDismiss: onClose, insideRefs });

  const handleNavigate = () => {
    if (closeOnNavigate) onClose();
  };
  const navAriaLabel = space ? t("subSidebar.navAriaLabel", { space: space.label }) : undefined;

  return (
    <aside
      ref={asideRef}
      aria-label={navAriaLabel}
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
              aria-label={t("subSidebar.closeAriaLabel")}
            >
              <Icon icon="lucide:x" className="size-4" />
            </button>
          </header>

          <nav aria-label={navAriaLabel} className="editorial-sub-sidebar-nav">
            {space.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`editorial-sub-sidebar-link ${link.isActive ? "is-active" : ""}`.trim()}
                aria-current={link.isActive ? "page" : undefined}
                onClick={handleNavigate}
              >
                <Icon icon={link.icon} className="size-4" aria-hidden />
                <span>{link.label}</span>
                <NavCountBadge badge={link.badge} />
              </Link>
            ))}

            {space.membership && (
              <>
                <span aria-hidden className="editorial-sub-sidebar-divider" />
                {space.membership.isLoading ? (
                  <p className="editorial-sub-sidebar-empty">{t("subSidebar.loading")}</p>
                ) : (
                  space.membership.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`editorial-sub-sidebar-link ${link.isActive ? "is-active" : ""}`.trim()}
                      aria-current={link.isActive ? "page" : undefined}
                      onClick={handleNavigate}
                    >
                      <MembershipAvatar link={link} />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  ))
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </aside>
  );
}
