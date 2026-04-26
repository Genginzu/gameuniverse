"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { CharacterPlatformsCard } from "./CharacterPlatformsCard";
import { CharacterRelationshipsCard } from "./CharacterRelationshipsCard";
import type { CharacterDetails } from "@/types/character";

interface CharacterDescriptionTabProps {
  character: CharacterDetails;
  locale: string;
  colors: { primary: string; secondary: string; accent: string; bg: string };
  primaryGame: { releaseYear?: number } | undefined;
}

export function CharacterDescriptionTab({
  character,
  locale: _locale,
  colors,
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
        accentColor={colors.accent}
      />

      <CharacterPlatformsCard platforms={character.platforms} accentColor={colors.accent} />

      {character.weapons && (
        <SectionCard
          icon="lucide:swords"
          title={t("characters.details.weaponsEquipment")}
          accentColor={colors.accent}
        >
          <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{character.weapons}</p>
        </SectionCard>
      )}

      {character.biography && (
        <SectionCard
          icon="lucide:book-open"
          title={t("characters.details.biography")}
          accentColor={colors.accent}
        >
          <div className="prose prose-invert max-w-none">
            <p className="leading-relaxed whitespace-pre-wrap text-slate-300">
              {character.biography}
            </p>
          </div>
        </SectionCard>
      )}

      {character.relationships && character.relationships.length > 0 && (
        <CharacterRelationshipsCard
          relationships={character.relationships}
          accentColor={colors.accent}
        />
      )}

      {isEmpty && (
        <div className="py-16 text-center">
          <Icon icon="lucide:book-open" className="mx-auto mb-4 h-12 w-12 text-slate-500" />
          <p className="text-slate-400">{t("characters.details.noDescription")}</p>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  accentColor,
  children,
}: {
  icon: string;
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
      <CardContent className="p-6">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Icon icon={icon} className="h-5 w-5" style={{ color: accentColor }} />
          {title}
        </h4>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoCards({
  role,
  primaryGameName,
  primaryGameYear,
  gamesCount,
  accentColor,
}: {
  role?: string;
  primaryGameName: string;
  primaryGameYear?: number;
  gamesCount: number;
  accentColor: string;
}) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {role && (
        <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Icon icon="lucide:star" className="h-4 w-4" style={{ color: accentColor }} />
              <span className="text-sm font-medium">{t("characters.details.role")}</span>
            </div>
            <p className="text-lg font-semibold text-white">{role}</p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Icon icon="lucide:gamepad-2" className="h-4 w-4" style={{ color: accentColor }} />
            <span className="text-sm font-medium">{t("characters.details.primaryGame")}</span>
          </div>
          <p className="text-lg font-semibold text-white">{primaryGameName}</p>
          {primaryGameYear && <p className="mt-1 text-sm text-slate-400">{primaryGameYear}</p>}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Icon icon="lucide:users" className="h-4 w-4" style={{ color: accentColor }} />
            <span className="text-sm font-medium">{t("characters.details.appearances")}</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {t("characters.details.gamesCount", { count: gamesCount })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
