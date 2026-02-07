"use client";

import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameVersion } from "@/types/game";
import Image from "next/image";

interface GameVersionsProps {
  versions: GameVersion[] | undefined;
  accentColor: string;
}

export function GameVersions({ versions, accentColor }: GameVersionsProps) {
  const t = useTranslations("gameDetails.versions");

  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {versions.map((version) => (
          <div
            key={version.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-slate-600"
          >
            {version.coverImageUrl ? (
              <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-lg bg-slate-900/50">
                <Image
                  src={version.coverImageUrl}
                  alt={version.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="mb-3 flex aspect-[3/4] items-center justify-center rounded-lg"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Package className="h-12 w-12" style={{ color: accentColor }} />
              </div>
            )}
            <h4 className="truncate text-sm font-medium text-white" title={version.title}>
              {version.title}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
}
