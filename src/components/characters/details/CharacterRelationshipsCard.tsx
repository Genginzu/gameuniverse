"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterRelationship } from "@/types/character";

const ACCENT = "rgb(var(--accent-rgb, var(--neon-primary)))";

function getRelationshipColors(type: string) {
  if (type === "ally" || type === "friend") return { bg: "#10b98120", text: "#34d399" };
  if (type === "enemy" || type === "rival") return { bg: "#ef444420", text: "#f87171" };
  if (type === "family" || type === "romantic") return { bg: "#f59e0b20", text: "#fbbf24" };
  return { bg: "#8b5cf620", text: "#a78bfa" };
}

interface CharacterRelationshipsCardProps {
  relationships: CharacterRelationship[];
}

export function CharacterRelationshipsCard({ relationships }: CharacterRelationshipsCardProps) {
  const t = useTranslations();

  return (
    <div className="border-editorial-line bg-editorial-2 rounded-2xl border p-6">
      <h4 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
        <Icon icon="lucide:user-circle" className="h-5 w-5" style={{ color: ACCENT }} />
        {t("characters.details.relationships")}
      </h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {relationships.map((rel) => {
          const relColors = getRelationshipColors(rel.relationshipType);
          return (
            <Link
              key={rel.id}
              href={`/characters/${rel.relatedCharacter.slug}`}
              className="border-editorial-line bg-editorial-3 group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="border-editorial-line relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2">
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
                  <div className="bg-editorial-2 text-editorial-muted flex h-full w-full items-center justify-center">
                    <Icon icon="lucide:user-circle" className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white transition-colors group-hover:text-[rgb(var(--accent-rgb,var(--neon-primary)))]">
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
                  <p className="text-editorial-muted mt-1 line-clamp-1 text-sm">
                    {rel.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
