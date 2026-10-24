/**
 * EditorialPageHeader : en-tête standard des pages éditoriales
 * (kicker mono + titre display avec mot accentué + sous-titre muted).
 *
 * Slots optionnels :
 *   - `children` : contenu additionnel sous le sous-titre (lien, badge…).
 *   - `aside`    : bloc à droite sur desktop (stats inline) — active la
 *                  grille 5/7 ; sans `aside`, le texte prend toute la largeur.
 *   - `actions`  : boutons alignés à droite du titre (ex « Tout marquer lu »).
 *
 * Variante `compact` pour les sous-pages (paramètres, connexions) : titre
 * plus petit et filet de séparation sous l'en-tête.
 *
 * Voir docs/design/editorial-components.md.
 */

import type { ReactNode } from "react";

import { KickerLabel } from "./KickerLabel";

interface EditorialPageHeaderProps {
  kicker: ReactNode;
  /** Début du titre (ou titre complet si `titleAccent` est omis). */
  title: ReactNode;
  /** Fin du titre affichée dans la couleur d'accent. */
  titleAccent?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
  variant?: "default" | "compact";
  className?: string;
}

const TITLE_SIZE = {
  default: "text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05]",
  compact: "text-[clamp(1.5rem,2.5vw+0.5rem,2.25rem)] leading-tight",
} as const;

export function EditorialPageHeader({
  kicker,
  title,
  titleAccent,
  subtitle,
  children,
  aside,
  actions,
  variant = "default",
  className = "",
}: EditorialPageHeaderProps) {
  const isCompact = variant === "compact";

  const layout = aside
    ? "grid grid-cols-1 gap-6 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12"
    : actions
      ? "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      : "";
  const separator = isCompact ? "border-editorial-line border-b pb-8" : "";

  return (
    <header className={`mb-10 ${layout} ${separator} ${className}`.trim()}>
      <div className="min-w-0">
        <KickerLabel>{kicker}</KickerLabel>
        <h1
          className={`font-display mt-2 font-bold tracking-tight text-white ${TITLE_SIZE[variant]}`}
        >
          {title}
          {titleAccent && (
            <>
              {" "}
              <span className="text-editorial-accent">{titleAccent}</span>
            </>
          )}
        </h1>
        {subtitle && (
          <p
            className={`text-editorial-muted text-base leading-relaxed text-pretty ${
              isCompact ? "mt-3" : "mt-4"
            }`}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {aside}
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
