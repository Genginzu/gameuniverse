/**
 * Marquee : conteneur défilant infini.
 *
 * Duplique automatiquement le contenu pour assurer la continuité visuelle.
 * Le défilement est une animation CSS pure (`animation: marquee-scroll`),
 * désactivée si l'utilisateur a `prefers-reduced-motion`.
 *
 * Hérité du POC, voir docs/design/editorial-refonte-plan.md.
 */

import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Espacement Tailwind entre les éléments dupliqués (défaut: gap-16). */
  gapClassName?: string;
}

export function Marquee({
  children,
  className = "",
  gapClassName = "gap-16",
}: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`.trim()}>
      <div className="marquee">
        <div className={`flex shrink-0 items-center ${gapClassName}`.trim()}>{children}</div>
        <div
          aria-hidden
          className={`flex shrink-0 items-center ${gapClassName}`.trim()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
