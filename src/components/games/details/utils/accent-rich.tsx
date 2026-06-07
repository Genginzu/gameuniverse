/**
 * Mapping de composants rich-text pour next-intl.
 *
 * Permet aux clés de traduction d'utiliser `<accent>...</accent>` autour
 * du mot à mettre en valeur dans un titre, et de le rendre comme un
 * `<span class="accent">` qui hérite du dégradé d'accent dynamique défini
 * dans `editorial/game-detail.css`.
 *
 * Usage :
 * ```tsx
 * import { accentRich } from "../utils/accent-rich";
 * <h2>{t.rich("sections.aboutTitle", accentRich)}</h2>
 * ```
 */

import type { ReactNode } from "react";

export const accentRich = {
  accent: (chunks: ReactNode) => <span className="accent">{chunks}</span>,
};
