"use client";

/**
 * EditorialShell : wrapper pratique qui assemble le shell éditorial complet
 * pour les pages publiques refondues.
 *
 * Combine :
 *   - `EditorialLayout` (rail + sub-sidebar + mobile nav)
 *   - `EditorialMegaMenu` en header avec ses 3 slots branchés :
 *       - `searchSlot` → `HeaderSearchTrigger` (active l'overlay)
 *       - `languageSlot` → `HeaderLanguageSwitcher`
 *       - `userSlot` → `HeaderUserDropdown` (F0-07f / #264)
 *   - `SearchOverlay` avec son state d'ouverture
 *
 * Ce composant remplace l'usage direct de `EditorialLayout` dans les pages.
 * Les pages éditoriales doivent en réalité utiliser `EditorialShell` pour
 * obtenir la nav et la recherche fonctionnelles.
 *
 * Cas où il faut continuer à utiliser `EditorialLayout` directement :
 *   - Pages qui personnalisent leur header (ex : home avec hero edge-to-edge
 *     dont l'image doit toucher le top sans header sticky par-dessus)
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useState, type ReactNode } from "react";

import { EditorialLayout } from "./EditorialLayout";
import { EditorialMegaMenu } from "./EditorialMegaMenu";
import { HeaderLanguageSwitcher } from "./HeaderLanguageSwitcher";
import { HeaderSearchTrigger } from "./HeaderSearchTrigger";
import { HeaderUserDropdown } from "./HeaderUserDropdown";
import { SearchOverlay } from "./search/SearchOverlay";

interface EditorialShellProps {
  /** Contenu principal de la page. */
  children: ReactNode;
  /**
   * Si `true`, le hamburger mobile par défaut n'est pas rendu.
   * Forwarded à `EditorialLayout`.
   */
  disableMobileNav?: boolean;
  /** Classe additionnelle sur le wrapper racine. */
  className?: string;
}

export function EditorialShell({
  children,
  disableMobileNav = false,
  className = "",
}: EditorialShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <EditorialLayout
        className={className}
        disableMobileNav={disableMobileNav}
        header={
          <EditorialMegaMenu
            searchSlot={<HeaderSearchTrigger onActivate={() => setIsSearchOpen(true)} />}
            languageSlot={<HeaderLanguageSwitcher />}
            userSlot={<HeaderUserDropdown />}
          />
        }
      >
        {children}
      </EditorialLayout>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
