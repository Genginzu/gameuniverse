"use client";

import { useTranslations } from "next-intl";

import { EditorialPageHeader } from "@/components/shared/EditorialPageHeader";
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
      <EditorialPageHeader
        variant="compact"
        kicker={t("kicker")}
        title={t("titlePrefix")}
        titleAccent={t("titleAccent")}
        subtitle={t("subtitle")}
      />

      <LinkedPlatformsSection />
    </EditorialContainer>
  );
}
