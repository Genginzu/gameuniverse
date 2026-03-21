"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { CharacterPlatformsCard } from "./CharacterPlatformsCard";
import type { CharacterDetails, CharacterRelationship } from "@/types/character";
import type { PlatformSummary } from "@/types/platform";

interface CharacterDescriptionTabProps {
  character: CharacterDetails;
  locale: string;
  colors: { primary: string; secondary: string; accent: string; bg: string };
  primaryGame: { releaseYear?: number } | undefined;
}

export function CharacterDescriptionTab({
  character,
  locale,
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

      {character.weapons && <WeaponsCard weapons={character.weapons} accentColor={colors.accent} />}

      {character.biography && (
        <BiographyCard biography={character.biography} accentColor={colors.accent} />
      )}

      {character.relationships && character.relationships.length > 0 && (
        <RelationshipsCard
          relationships={character.relationships}
          locale={locale}
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

/* ── Info Cards (role, primary game, appearances) ── */

interface InfoCardsProps {
  role?: string;
  primaryGameName: string;
  primaryGameYear?: number;
  gamesCount: number;
  accentColor: string;
}

function InfoCards({
  role,
  primaryGameName,
  primaryGameYear,
  gamesCount,
  accentColor,
}: InfoCardsProps) {
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

/* ── Weapons Card ── */

function WeaponsCard({ weapons, accentColor }: { weapons: string; accentColor: string }) {
  const t = useTranslations();

  return (
    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
      <CardContent className="p-6">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Icon icon="lucide:swords" className="h-5 w-5" style={{ color: accentColor }} />
          {t("characters.details.weaponsEquipment")}
        </h4>
        <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{weapons}</p>
      </CardContent>
    </Card>
  );
}

/* ── Biography Card ── */

function BiographyCard({ biography, accentColor }: { biography: string; accentColor: string }) {
  const t = useTranslations();

  return (
    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
      <CardContent className="p-6">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Icon icon="lucide:book-open" className="h-5 w-5" style={{ color: accentColor }} />
          {t("characters.details.biography")}
        </h4>
        <div className="prose prose-invert max-w-none">
          <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{biography}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Relationships Card ── */

function getRelationshipColors(type: string) {
  if (type === "ally" || type === "friend") return { bg: "#10b98120", text: "#34d399" };
  if (type === "enemy" || type === "rival") return { bg: "#ef444420", text: "#f87171" };
  if (type === "family" || type === "romantic") return { bg: "#f59e0b20", text: "#fbbf24" };
  return { bg: "#8b5cf620", text: "#a78bfa" };
}

interface RelationshipsCardProps {
  relationships: CharacterRelationship[];
  locale: string;
  accentColor: string;
}

function RelationshipsCard({ relationships, locale, accentColor }: RelationshipsCardProps) {
  const t = useTranslations();

  return (
    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
      <CardContent className="p-6">
        <h4 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
          <Icon icon="lucide:user-circle" className="h-5 w-5" style={{ color: accentColor }} />
          {t("characters.details.relationships")}
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {relationships.map((rel) => {
            const relColors = getRelationshipColors(rel.relationshipType);
            return (
              <Link
                key={rel.id}
                href={`/${locale}/characters/${rel.relatedCharacter.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/50"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-600">
                  {rel.relatedCharacter.mainImage ? (
                    <LazyImage
                      src={rel.relatedCharacter.mainImage}
                      alt={rel.relatedCharacter.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                      showSkeleton={true}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-700">
                      <Icon icon="lucide:user-circle" className="h-8 w-8 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white transition-colors group-hover:text-violet-300">
                    {rel.relatedCharacter.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1 text-xs"
                    style={{ backgroundColor: relColors.bg, color: relColors.text }}
                  >
                    {t(`characters.details.relationshipTypes.${rel.relationshipType}`) ||
                      rel.relationshipType.charAt(0).toUpperCase() + rel.relationshipType.slice(1)}
                  </Badge>
                  {rel.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-slate-400">{rel.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
