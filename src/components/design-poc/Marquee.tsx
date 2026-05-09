/**
 * Marquee infini avec contenu défilant. Duplique automatiquement les
 * children pour assurer la continuité.
 */

import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
}

export function Marquee({ children, className = "" }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="poc-marquee">
        <div className="flex shrink-0 items-center gap-16">{children}</div>
        <div aria-hidden className="flex shrink-0 items-center gap-16">
          {children}
        </div>
      </div>
    </div>
  );
}
