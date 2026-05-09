"use client";

/**
 * Shell pour la variante "Hybrid" : top mega-menu + Cmd+K palette.
 *
 * Component client car PocMegaMenu et PocCommandPalette gèrent du state
 * (panel ouvert, query…). Wrappe les enfants pour qu'on puisse l'utiliser
 * depuis un server component.
 */

import { useState, type ReactNode } from "react";
import { PocMegaMenu } from "@/components/design-poc/PocMegaMenu";
import { PocCommandPalette } from "@/components/design-poc/PocCommandPalette";

interface HybridShellProps {
  locale: string;
  children: ReactNode;
}

export function HybridShell({ locale, children }: HybridShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      <PocMegaMenu locale={locale} onOpenPalette={() => setPaletteOpen(true)} />
      <PocCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} locale={locale} />
      {children}
    </>
  );
}
