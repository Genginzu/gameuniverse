import type { ReactNode } from "react";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";

/**
 * Shell éditorial des pages Esport : assemble `EditorialShell` (rail +
 * mega-menu + recherche) et un conteneur `.editorial-esport` qui pose le fond
 * sombre éditorial et neutralise le glassmorphism legacy des composants esport.
 */
export function EsportShell({ children }: { children: ReactNode }) {
  return (
    <EditorialShell>
      <div className="editorial-esport">{children}</div>
    </EditorialShell>
  );
}
