/**
 * Helper qui transforme une string i18n contenant des balises pseudo-XML
 * `<accent>...</accent>` en JSX, en remplaçant les balises par un span
 * stylé avec la classe `.accent` (couleur d'accent dynamique).
 *
 * Permet aux clés de traduction de marquer le mot accentué d'un titre
 * sans coupler la traduction au markup React.
 *
 * Exemple :
 *   `renderAccentSegments("L'<accent>histoire</accent>")` →
 *   `["L'", <span class="accent" key="1">histoire</span>, ""]`
 */

import type { ReactNode } from "react";

const ACCENT_PATTERN = /<accent>([^<]+)<\/accent>/g;

export function renderAccentSegments(input: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = ACCENT_PATTERN.exec(input)) !== null) {
    if (match.index > lastIndex) {
      parts.push(input.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={`accent-${counter++}`} className="accent">
        {match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    parts.push(input.slice(lastIndex));
  }

  return parts;
}
