"use client";

/**
 * EditorialRail : barre verticale 56px persistante (Discord-style) avec :
 *
 *   - Un bouton burger qui élargit le rail pour afficher les libellés
 *   - Une icône par Space du Navigation Model, chacune cliquable pour ouvrir
 *     une sub-sidebar
 *   - Un indicateur visuel sur l'espace actif (Active Space du modèle, ou la
 *     prop `openSpace` si la sub-sidebar est ouverte)
 *
 * Pure mise en page : espaces, libellés et état actif viennent de
 * `useEditorialNavigation()` (voir `src/lib/navigation`). La persistance de
 * la sub-sidebar ouverte est gérée par le parent (`useEditorialRailState`).
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useEditorialNavigation } from "@/hooks/useEditorialNavigation";
import type { NavSpaceKey } from "@/types/navigation";

interface EditorialRailProps {
  /**
   * Space dont la sub-sidebar est ouverte (géré par le parent). Si fourni,
   * l'indicateur visuel s'aligne sur ce space plutôt que sur la location.
   */
  openSpace?: NavSpaceKey | null;
  /** Appelé au clic sur une icône. Le parent décide d'ouvrir/fermer/changer. */
  onToggleSpace?: (key: NavSpaceKey) => void;
  /** Classe additionnelle pour le `<aside>` racine. */
  className?: string;
}

export function EditorialRail({ openSpace, onToggleSpace, className = "" }: EditorialRailProps) {
  const t = useTranslations("editorial");
  const { spaces, activeSpaceKey } = useEditorialNavigation();

  // Rail replié (icônes seules) par défaut ; le bouton burger l'élargit pour
  // afficher les libellés à côté des icônes.
  const [expanded, setExpanded] = useState(false);

  const highlightedSpace = openSpace ?? activeSpaceKey;

  return (
    <aside
      aria-label={t("rail.ariaLabel")}
      className={`editorial-rail ${expanded ? "is-expanded" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={t("rail.toggleAriaLabel")}
        aria-expanded={expanded}
        className="editorial-rail-toggle"
      >
        <Icon icon="lucide:menu" className="size-5" />
      </button>

      <span aria-hidden className="editorial-rail-divider" />

      <nav aria-label={t("rail.spacesAriaLabel")} className="editorial-rail-nav">
        {spaces.map((space) => {
          const isActive = highlightedSpace === space.key;
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
              <Icon icon={space.icon} className="editorial-rail-button-icon size-4" />
              <span className="editorial-rail-button-label">{space.label}</span>
              {isActive && <span aria-hidden className="editorial-rail-active-pill" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
