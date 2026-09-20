"use client";

/**
 * EditorialSubSidebar : panneau secondaire 220px qui glisse depuis la
 * gauche, à droite du rail (F0-08). Affiche les liens d'un espace
 * (Games, Esport, Library, Community, Coaching).
 *
 * Comportement :
 * - Slide-in de 220px (animation CSS) quand `space` est non-null
 * - Largeur 0 + retiré du flux quand `space` est null
 * - Fermeture sur Escape, clic en dehors, ou clic sur un lien
 * - Indicateur visuel sur le lien actif (basé sur le pathname courant)
 * - Pas de backdrop-blur (refonte éditoriale)
 *
 * L'état d'ouverture est géré par le parent via `useEditorialRailState`
 * (ce composant est purement contrôlé). Tous les libellés visibles
 * passent par next-intl.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import { useMyGroups } from "@/hooks/useMyGroups";
import { useMyCommunities } from "@/hooks/useMyCommunities";

import type { EditorialSpace } from "./EditorialRail";

interface EditorialSubSidebarProps {
  /** Space affiché. `null` = fermée. */
  space: EditorialSpace | null;
  /** Callback de fermeture (Escape, ╳, clic en dehors). */
  onClose: () => void;
  /**
   * Si `true`, ferme aussi au clic sur un lien (UX standard).
   * Activé par défaut pour la navigation desktop.
   */
  closeOnNavigate?: boolean;
}

export function EditorialSubSidebar({
  space,
  onClose,
  closeOnNavigate = true,
}: EditorialSubSidebarProps) {
  const isOpen = space !== null;
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);
  const t = useTranslations("editorial");

  // Toujours appelés (règles des Hooks) ; le rendu ci-dessous décide lequel utiliser.
  const { groups: myGroups, isLoading: isLoadingMyGroups } = useMyGroups();
  const { communities: myCommunities, isLoading: isLoadingMyCommunities } = useMyCommunities();

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside closes
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const aside = asideRef.current;
      if (!aside || !target) return;
      if (aside.contains(target)) return;
      // Aussi ignorer les clics sur le rail (le toggle gère sa propre logique)
      const rail = document.querySelector(".editorial-rail");
      if (rail && rail.contains(target)) return;
      onClose();
    };
    // Utilise pointerdown pour réagir avant que le focus change
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  const spaceLabel = space ? t(`spaces.${space.key}`) : "";

  return (
    <aside
      ref={asideRef}
      aria-label={space ? t("subSidebar.navAriaLabel", { space: spaceLabel }) : undefined}
      aria-hidden={!isOpen}
      className={`editorial-sub-sidebar ${isOpen ? "is-open" : ""}`.trim()}
      data-space={space?.key}
    >
      {space && (
        <div className="editorial-sub-sidebar-inner">
          <header className="editorial-sub-sidebar-header">
            <h2 className="editorial-display text-lg text-white">{spaceLabel}</h2>
            <button
              type="button"
              onClick={onClose}
              className="editorial-sub-sidebar-close"
              aria-label={t("subSidebar.closeAriaLabel")}
            >
              <Icon icon="lucide:x" className="size-4" />
            </button>
          </header>

          <nav
            aria-label={t("subSidebar.navAriaLabel", { space: spaceLabel })}
            className="editorial-sub-sidebar-nav"
          >
            {space.links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`editorial-sub-sidebar-link ${active ? "is-active" : ""}`.trim()}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    if (closeOnNavigate) {
                      onClose();
                    }
                  }}
                >
                  <Icon icon={link.icon} className="size-4" aria-hidden />
                  <span>{t(`links.${space.key}.${link.labelKey}`)}</span>
                </Link>
              );
            })}

            {space.key === "groups" && (
              <MembershipSection
                items={myGroups}
                isLoading={isLoadingMyGroups}
                basePath="/groups"
                icon="lucide:users"
                emptyKey="noMyGroups"
                closeOnNavigate={closeOnNavigate}
                onNavigate={onClose}
              />
            )}

            {space.key === "communities" && (
              <MembershipSection
                items={myCommunities}
                isLoading={isLoadingMyCommunities}
                basePath="/communities"
                icon="lucide:globe-2"
                emptyKey="noMyCommunities"
                closeOnNavigate={closeOnNavigate}
                onNavigate={onClose}
              />
            )}
          </nav>
        </div>
      )}
    </aside>
  );
}

interface MembershipItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface MembershipSectionProps {
  items: MembershipItem[];
  isLoading: boolean;
  basePath: string;
  icon: string;
  /** Sous-clé i18n dans `editorial.subSidebar.{emptyKey}`. */
  emptyKey: string;
  closeOnNavigate: boolean;
  onNavigate: () => void;
}

/**
 * Section dynamique "mes groupes" / "mes communautés" : séparateur puis la
 * liste (triée alphabétiquement par le serveur) des espaces dont
 * l'utilisateur est membre. Masquée si non authentifié (hooks retournent []).
 */
function MembershipSection({
  items,
  isLoading,
  basePath,
  icon,
  emptyKey,
  closeOnNavigate,
  onNavigate,
}: MembershipSectionProps) {
  const t = useTranslations("editorial.subSidebar");
  const pathname = usePathname();

  if (!isLoading && items.length === 0) return null;

  return (
    <>
      <span aria-hidden className="editorial-sub-sidebar-divider" />
      {isLoading ? (
        <p className="editorial-sub-sidebar-empty">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="editorial-sub-sidebar-empty">{t(emptyKey)}</p>
      ) : (
        items.map((item) => {
          const href = `${basePath}/${item.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={item.id}
              href={href}
              className={`editorial-sub-sidebar-link ${active ? "is-active" : ""}`.trim()}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (closeOnNavigate) {
                  onNavigate();
                }
              }}
            >
              <span className="editorial-sub-sidebar-avatar" aria-hidden>
                {item.imageUrl ? (
                  <LazyImage src={item.imageUrl} alt="" fill sizes="20px" className="object-cover" />
                ) : (
                  <Icon icon={icon} className="size-4" />
                )}
              </span>
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })
      )}
    </>
  );
}
