/**
 * StatXL : statistique éditoriale avec un chiffre XL (police display) et
 * un label uppercase mono en dessous (`KickerLabel`).
 *
 * Pattern utilisé sur la home et les pages de stats (ex « 10K · JEUX
 * RÉFÉRENCÉS », « 240+ · TOURNOIS LIVE »).
 *
 * Le `value` est rendu tel quel (chaîne ou nœud React) pour permettre
 * l'utilisation de notations courtes ou suffixes stylés (ex `10K+`).
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import type { ReactNode } from "react";

import { KickerLabel } from "./KickerLabel";

interface StatXLProps {
  /** Valeur principale, affichée en grand (police display Tomorrow). */
  value: ReactNode;
  /** Label sous la valeur, uppercase mono. */
  label: ReactNode;
  /** Classes Tailwind additionnelles sur le conteneur. */
  className?: string;
  /** Élément HTML rendu (par défaut `div`). */
  as?: "div" | "li" | "article";
}

export function StatXL({ value, label, className = "", as: Tag = "div" }: StatXLProps) {
  const merged = `flex flex-col gap-2 ${className}`.trim();
  return (
    <Tag className={merged}>
      <span className="editorial-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-white">
        {value}
      </span>
      <KickerLabel as="span">{label}</KickerLabel>
    </Tag>
  );
}
