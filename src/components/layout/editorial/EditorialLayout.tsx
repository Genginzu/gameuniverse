"use client";

/**
 * EditorialLayout : shell de layout pour les pages publiques refondues.
 *
 * Orchestre :
 *   - Un slot `header` sticky en haut (full-width, futur mega-menu F0-07).
 *   - `EditorialRail` à gauche (56px, masqué sous lg).
 *   - `EditorialSubSidebar` qui slide depuis le rail (220px, masquée sous lg).
 *   - `EditorialMobileNav` (hamburger + overlay full-screen, visible sous lg).
 *   - `children` : le contenu de la page.
 *
 * L'état d'ouverture de la sub-sidebar est géré ici via `useEditorialRailState`
 * (persistance localStorage incluse). Le rail et la sub-sidebar sont synchronisés.
 *
 * Ce layout n'est **pas** utilisé par `/admin/*` : l'admin garde son propre
 * `DashboardLayout` avec sidebar permanente.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import type { ReactNode } from "react";

import { EditorialMobileNav } from "./EditorialMobileNav";
import {
  EditorialRail,
  EDITORIAL_SPACES,
  type EditorialSpace,
} from "./EditorialRail";
import { EditorialSubSidebar } from "./EditorialSubSidebar";
import { useEditorialRailState } from "@/hooks/useEditorialRailState";

interface EditorialLayoutProps {
  /**
   * Contenu rendu sticky en haut de la page (mega-menu desktop, brand mobile).
   * Optionnel — si absent, aucun header n'est rendu (les pages peuvent se
   * dessiner edge-to-edge, ex la home avec son hero plein écran).
   */
  header?: ReactNode;
  /**
   * Si `true`, le hamburger mobile par défaut (`EditorialMobileNav`) n'est
   * pas rendu. À utiliser quand le slot `header` fournit déjà sa propre
   * version mobile.
   */
  disableMobileNav?: boolean;
  /** Contenu principal de la page. */
  children: ReactNode;
  /** Classe additionnelle sur le wrapper racine. */
  className?: string;
}

export function EditorialLayout({
  header,
  disableMobileNav = false,
  children,
  className = "",
}: EditorialLayoutProps) {
  const { openSpace, toggleSpace, closeSpace } = useEditorialRailState();

  const space: EditorialSpace | null = openSpace
    ? EDITORIAL_SPACES.find((s) => s.key === openSpace) ?? null
    : null;

  return (
    <div className={`editorial-layout ${className}`.trim()}>
      {header && (
        <header className="editorial-layout-header" data-testid="editorial-layout-header">
          {header}
        </header>
      )}

      <div className="editorial-layout-body">
        {/* Rail vertical — caché sous lg */}
        <div className="editorial-layout-rail">
          <EditorialRail openSpace={openSpace} onToggleSpace={toggleSpace} />
        </div>

        {/* Sub-sidebar — caché sous lg */}
        <div className="editorial-layout-sub-sidebar">
          <EditorialSubSidebar space={space} onClose={closeSpace} />
        </div>

        {/* Contenu */}
        <main className="editorial-layout-main" data-testid="editorial-layout-main">
          {children}
        </main>
      </div>

      {/* Hamburger + overlay mobile — visible uniquement sous lg */}
      {!disableMobileNav && (
        <div className="editorial-layout-mobile-nav">
          <EditorialMobileNav />
        </div>
      )}
    </div>
  );
}
