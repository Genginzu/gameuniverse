"use client";

/**
 * EditorialRail : barre verticale 56px persistante (Discord-style) avec :
 *
 *   - Le logo Gamers Universe en haut (cliquable, retourne à `/`)
 *   - 5 icônes des grands espaces du site (Games, Esport, Library, Community,
 *     Coaching), chacune cliquable pour ouvrir une sub-sidebar
 *   - Un indicateur visuel sur l'espace actif (déterminé par l'URL courante,
 *     ou par la prop `openSpace` si la sub-sidebar est ouverte)
 *
 * Ce composant est volontairement **isolé** : il ne gère pas la persistance
 * localStorage (c'est le rôle du parent / de la sub-sidebar, voir F0-09) et
 * ne contient pas de mega-menu (voir F0-07). Il expose un callback
 * `onToggleSpace` pour que le parent décide quoi faire.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useMemo } from "react";
import { Icon } from "@iconify/react";

import { Link, usePathname } from "@/i18n/navigation";

// ============================================================================
// Spaces — exporté pour réutilisation par la sub-sidebar (F0-09)
// ============================================================================

export type EditorialSpaceKey =
  | "games"
  | "esport"
  | "library"
  | "community"
  | "coaching";

export interface EditorialSpace {
  /** Identifiant stable du space (clé de routage interne). */
  key: EditorialSpaceKey;
  /** Label court, utilisé pour le tooltip et l'a11y. */
  label: string;
  /** Icône Iconify (préfixe `fa:`, `mdi:`, `lucide:`…). */
  icon: string;
  /**
   * Préfixes de pathname qui appartiennent à ce space, **sans** locale.
   * Le premier est aussi utilisé comme cible de fallback si on clique sur
   * l'icône sans sub-sidebar (ex pour la nav mobile).
   */
  pathPrefixes: string[];
}

export const EDITORIAL_SPACES: readonly EditorialSpace[] = [
  {
    key: "games",
    label: "Games",
    icon: "fa:dice",
    pathPrefixes: ["/games", "/trending", "/upcoming", "/characters", "/favorites/characters"],
  },
  {
    key: "esport",
    label: "Esport",
    icon: "fa:bolt",
    pathPrefixes: ["/esport"],
  },
  {
    key: "library",
    label: "Library",
    icon: "fa:gamepad",
    pathPrefixes: ["/library", "/collections", "/profile"],
  },
  {
    key: "community",
    label: "Community",
    icon: "fa:user-friends",
    pathPrefixes: ["/players", "/discussions", "/friends"],
  },
  {
    key: "coaching",
    label: "Coaching",
    icon: "fa:graduation-cap",
    pathPrefixes: ["/coaching"],
  },
];

/**
 * Retourne le space dont l'un des `pathPrefixes` matche le pathname courant.
 * `null` si aucun ne matche (ex: `/`, `/auth/...`, `/admin/...`).
 *
 * Exposé pour les tests et pour la sub-sidebar.
 */
export function spaceFromPathname(pathname: string | null): EditorialSpaceKey | null {
  if (!pathname) return null;
  for (const space of EDITORIAL_SPACES) {
    for (const prefix of space.pathPrefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return space.key;
      }
    }
  }
  return null;
}

// ============================================================================
// Composant EditorialRail
// ============================================================================

interface EditorialRailProps {
  /**
   * Space dont la sub-sidebar est ouverte (géré par le parent). Si fourni,
   * l'indicateur visuel s'aligne sur ce space plutôt que sur le pathname.
   */
  openSpace?: EditorialSpaceKey | null;
  /** Appelé au clic sur une icône. Le parent décide d'ouvrir/fermer/changer. */
  onToggleSpace?: (key: EditorialSpaceKey) => void;
  /** Classe additionnelle pour le `<aside>` racine. */
  className?: string;
}

export function EditorialRail({
  openSpace,
  onToggleSpace,
  className = "",
}: EditorialRailProps) {
  const pathname = usePathname();

  // L'indicateur visuel suit la sub-sidebar ouverte si elle l'est, sinon le
  // space dérivé de l'URL courante.
  const activeSpace = useMemo<EditorialSpaceKey | null>(() => {
    if (openSpace !== undefined && openSpace !== null) return openSpace;
    return spaceFromPathname(pathname);
  }, [openSpace, pathname]);

  return (
    <aside
      aria-label="Editorial rail"
      className={`editorial-rail ${className}`.trim()}
    >
      {/* Logo en haut */}
      <Link
        href="/"
        aria-label="Gamers Universe — home"
        className="editorial-rail-logo"
      >
        <Icon icon="fa:gamepad" className="size-5" />
      </Link>

      {/* Séparateur fin */}
      <span aria-hidden className="editorial-rail-divider" />

      {/* 5 espaces */}
      <nav aria-label="Spaces" className="flex flex-col items-center gap-1">
        {EDITORIAL_SPACES.map((space) => {
          const isActive = activeSpace === space.key;
          return (
            <button
              key={space.key}
              type="button"
              onClick={() => onToggleSpace?.(space.key)}
              className={`editorial-rail-button ${isActive ? "is-active" : ""}`.trim()}
              aria-label={space.label}
              aria-pressed={isActive}
              data-space={space.key}
              title={space.label}
            >
              <Icon icon={space.icon} className="size-4" />
              {isActive && (
                <span aria-hidden className="editorial-rail-active-pill" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
