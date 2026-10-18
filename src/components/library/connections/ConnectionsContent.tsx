"use client";

import { useTranslations } from "next-intl";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { LinkedPlatformsSection } from "@/components/settings/LinkedPlatformsSection";

/**
 * ConnectionsContent : page dédiée à la connexion et la synchronisation des
 * comptes de plateformes gaming, dans l'espace "Mon univers" (`/library`).
 *
 * Réutilise `LinkedPlatformsSection` (connexion OAuth/NPSSO, saisie manuelle,
 * synchronisation de bibliothèque, visibilité) avec un en-tête éditorial.
 */
export function ConnectionsContent() {
  const t = useTranslations("connections");

  return (
    <EditorialContainer as="section">
      <header className="border-editorial-line mb-10 border-b pb-8">
        <KickerLabel>{t("kicker")}</KickerLabel>
        <h1 className="font-display mt-2 text-[clamp(1.5rem,2.5vw+0.5rem,2.25rem)] leading-tight font-bold tracking-tight text-white">
          {t("titlePrefix")} <span className="text-editorial-accent">{t("titleAccent")}</span>
        </h1>
        <p className="text-editorial-muted mt-3 max-w-[60ch] text-[0.95rem]">{t("subtitle")}</p>
      </header>

      <LinkedPlatformsSection />
    </EditorialContainer>
  );
}
