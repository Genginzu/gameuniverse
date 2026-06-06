"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { CharacterPlatformsCard } from "./CharacterPlatformsCard";
import { CharacterRelationshipsCard } from "./CharacterRelationshipsCard";
import type { CharacterDetails } from "@/types/character";

const ACCENT = "rgb(var(--accent-rgb, var(--neon-primary)))";

interface CharacterDescriptionTabProps {
  character: CharacterDetails;
  locale: string;
  primaryGame: { releaseYear?: number } | undefined;
}

export function CharacterDescriptionTab({
  character,
  locale: _locale,
  primaryGame,
}: CharacterDescriptionTabProps) {
  const t = useTranslations();

  const isEmpty =
    !character.biography &&
    !character.weapons &&
    (!character.relationships || character.relationships.length === 0);

  return (
    <div className="space-y-8">
      <InfoCards
        role={character.role}
        primaryGameName={character.primaryGame}
        primaryGameYear={primaryGame?.releaseYear}
        gamesCount={character.games.length}
      />

      <CharacterPlatformsCard platforms={character.platforms} />

      {character.weapons && (
        <SectionCard icon="lucide:swords" title={t("characters.details.weaponsEquipment")}>
          <p className="text-editorial-muted leading-relaxed whitespace-pre-wrap">
            {character.weapons}
          </p>
        </SectionCard>
      )}

      {character.biography && (
        <SectionCard icon="lucide:book-open" title={t("characters.details.biography")}>
          <p className="text-editorial-muted leading-relaxed whitespace-pre-wrap">
            {character.biography}
          </p>
        </SectionCard>
      )}

      {character.relationships && character.relationships.length > 0 && (
        <CharacterRelationshipsCard relationships={character.relationships} />
      )}

      {isEmpty && (
        <div className="py-16 text-center">
          <Icon icon="lucide:book-open" className="text-editorial-muted mx-auto mb-4 h-12 w-12" />
          <p className="text-editorial-muted">{t("characters.details.noDescription")}</p>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-editorial-line bg-editorial-2 rounded-2xl border p-6">
      <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <Icon icon={icon} className="h-5 w-5" style={{ color: ACCENT }} />
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoCards({
  role,
  primaryGameName,
  primaryGameYear,
  gamesCount,
}: {
  role?: string;
  primaryGameName: string;
  primaryGameYear?: number;
  gamesCount: number;
}) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {role && (
        <InfoCard icon="lucide:star" label={t("characters.details.role")}>
          <p className="text-lg font-semibold text-white">{role}</p>
        </InfoCard>
      )}

      <InfoCard icon="lucide:gamepad-2" label={t("characters.details.primaryGame")}>
        <p className="text-lg font-semibold text-white">{primaryGameName}</p>
        {primaryGameYear && (
          <p className="text-editorial-muted mt-1 text-sm">{primaryGameYear}</p>
        )}
      </InfoCard>

      <InfoCard icon="lucide:users" label={t("characters.details.appearances")}>
        <p className="text-lg font-semibold text-white">
          {t("characters.details.gamesCount", { count: gamesCount })}
        </p>
      </InfoCard>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-editorial-line bg-editorial-2 rounded-2xl border p-6">
      <div className="text-editorial-muted mb-2 flex items-center gap-2">
        <Icon icon={icon} className="h-4 w-4" style={{ color: ACCENT }} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}
