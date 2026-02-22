"use client";

import { Package } from "lucide-react";
import { GameVersion } from "@/types/game";
import Image from "next/image";

interface GameVersionsProps {
  versions: GameVersion[] | undefined;
  accentColor: string;
}

/** Formats description by adding line breaks around [Section] headers. */
function formatDescription(description: string): React.ReactNode {
  const parts = description.split(/(\[[^\]]+\])/g);

  return parts.map((part, index) => {
    if (/^\[[^\]]+\]$/.test(part)) {
      return (
        <span key={index} className="mt-3 block font-medium text-slate-200 first:mt-0">
          {part}
        </span>
      );
    }
    return part.trim() ? (
      <span key={index} className="block">
        {part.trim()}
      </span>
    ) : null;
  });
}

export function GameVersions({ versions, accentColor }: GameVersionsProps) {
  if (!versions || versions.length === 0) return null;

  return (
    <div className="columns-1 gap-3 md:columns-2">
      {versions.map((version) => (
        <div
          key={version.id}
          className="mb-3 break-inside-avoid rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/[0.08]"
        >
          <div className="flex gap-4">
            {/* Cover */}
            <div className="flex-shrink-0">
              {version.coverImageUrl ? (
                <div className="relative h-24 w-16 overflow-hidden rounded-lg bg-white/5">
                  <Image
                    src={version.coverImageUrl}
                    alt={version.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="flex h-24 w-16 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Package className="h-5 w-5" style={{ color: accentColor }} />
                </div>
              )}
            </div>

            {/* Content — full text, no truncation */}
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-sm font-medium text-white">{version.title}</h4>
              {version.description && (
                <div className="space-y-1 text-sm text-slate-400">
                  {formatDescription(version.description)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
