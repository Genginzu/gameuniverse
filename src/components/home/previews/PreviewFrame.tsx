/**
 * PreviewFrame : cadre "fenêtre d'app" des aperçus produit du landing.
 *
 * Le contenu est un mockup décoratif construit avec les vrais composants
 * partagés : `inert` le rend non focusable / non cliquable et `aria-hidden`
 * le retire de l'arbre d'accessibilité (le texte du bloc porte le sens).
 */

import type { ReactNode } from "react";
import { Icon } from "@iconify/react";

interface PreviewFrameProps {
  children: ReactNode;
}

export function PreviewFrame({ children }: PreviewFrameProps) {
  return (
    <div
      inert
      aria-hidden="true"
      data-testid="home-preview-frame"
      className="border-editorial-line bg-editorial-2 relative w-full min-w-0 overflow-hidden rounded-3xl border shadow-2xl shadow-black/40 select-none"
    >
      <div className="from-neon-secondary to-neon-primary absolute inset-x-0 top-0 h-px bg-gradient-to-r" />
      <div className="border-editorial-line flex items-center gap-1.5 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

interface PreviewPlaceholderProps {
  icon: string;
  label: string;
}

/** Shown inside a frame when the live data feeding a mockup is empty. */
export function PreviewPlaceholder({ icon, label }: PreviewPlaceholderProps) {
  return (
    <div className="border-editorial-line text-editorial-muted flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center text-sm">
      <Icon icon={icon} className="size-8" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
