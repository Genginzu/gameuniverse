/**
 * Layout isolé pour le POC design.
 *
 * Inspiration : Imba — fond aubergine sombre, accent dynamique par page,
 * typo display, pas de header/footer global du site (le POC gère son propre shell).
 *
 * Important : ce layout n'importe AUCUN composant existant du site. Toute
 * suppression du dossier design-poc retire complètement le POC sans effet
 * de bord.
 */

import "./design-poc.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Design POC — Gamers Universe",
  description: "Prototypage isolé d'une nouvelle direction artistique.",
  robots: { index: false, follow: false },
};

export default function DesignPocLayout({ children }: { children: ReactNode }) {
  return (
    <div className="poc-root min-h-screen bg-[#120821] text-zinc-100 antialiased">
      {/* Grain global subtil */}
      <div className="poc-grain pointer-events-none fixed inset-0 z-[1] opacity-[0.04] mix-blend-overlay" />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
