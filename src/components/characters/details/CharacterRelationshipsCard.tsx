"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterRelationship } from "@/types/character";

function getRelationshipColors(type: string) {
  if (type === "ally" || type === "friend") return { bg: "#10b98120", text: "#34d399" };
  if (type === "enemy" || type === "rival") return { bg: "#ef444420", text: "#f87171" };
  if (type === "family" || type === "romantic") return { bg: "#f59e0b20", text: "#fbbf24" };
  return { bg: "#8b5cf620", text: "#a78bfa" };
}

interface CharacterRelationshipsCardProps {
  relationships: CharacterRelationship[];
  accentColor: string;
}

export function CharacterRelationshipsCard({
  relationships,
  accentColor,
}: CharacterRelationshipsCardProps) {
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
                href={`/characters/${rel.relatedCharacter.slug}`}
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
                  <p className="font-semibold text-white transition-colors group-hover:text-palette-primary-300">
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
