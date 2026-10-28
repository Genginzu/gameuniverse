"use client";

/**
 * AccentPortalScope : propage la palette d'accent d'une page aux surfaces
 * rendues dans un portal (dialogs, lightbox), qui sortent du sous-arbre DOM
 * de <DynamicAccent> et perdent donc ses variables CSS.
 *
 * Le provider se place dans la page ; les primitives portalées
 * (`DialogContent`, `EditorialDialog`, lightbox) lisent `useAccentPortalScope()`
 * et réappliquent les variables + la classe `.editorial-game-accent-scope`.
 * Hors provider, le hook renvoie `null` : aucun changement.
 */

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";

import { accentStyle } from "@/components/shared/DynamicAccent";
import type { AccentPalette } from "@/lib/utils/accent-palette";

export interface AccentPortalScopeValue {
  className: string;
  style: CSSProperties;
}

const AccentPortalScopeContext = createContext<AccentPortalScopeValue | null>(null);

interface AccentPortalScopeProps {
  palette: AccentPalette;
  children: ReactNode;
}

export function AccentPortalScope({ palette, children }: AccentPortalScopeProps) {
  const value = useMemo(
    () => ({ className: "editorial-game-accent-scope", style: accentStyle(palette) }),
    [palette]
  );
  return (
    <AccentPortalScopeContext.Provider value={value}>{children}</AccentPortalScopeContext.Provider>
  );
}

export function useAccentPortalScope(): AccentPortalScopeValue | null {
  return useContext(AccentPortalScopeContext);
}
