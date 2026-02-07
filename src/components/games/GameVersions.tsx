"use client";

import { useState } from "react";
import { Package, ChevronDown } from "lucide-react";
import { GameVersion } from "@/types/game";
import Image from "next/image";

interface GameVersionsProps {
  versions: GameVersion[] | undefined;
  accentColor: string;
}

/**
 * Formats description by adding line breaks around [Section] headers
 */
function formatDescription(description: string): React.ReactNode {
  // Split by brackets pattern, keeping the brackets in the result
  const parts = description.split(/(\[[^\]]+\])/g);

  return parts.map((part, index) => {
    // Check if this part is a [Section] header
    if (/^\[[^\]]+\]$/.test(part)) {
      return (
        <span key={index} className="mt-3 block font-medium text-slate-300 first:mt-0">
          {part}
        </span>
      );
    }
    // Regular text
    return part.trim() ? (
      <span key={index} className="block">
        {part.trim()}
      </span>
    ) : null;
  });
}

export function GameVersions({ versions, accentColor }: GameVersionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!versions || versions.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {versions.map((version) => {
          const isExpanded = expandedId === version.id || hoveredId === version.id;
          const hasLongDescription = version.description && version.description.length > 150;

          return (
            <div
              key={version.id}
              style={{
                flexBasis: isExpanded ? "100%" : "calc(50% - 0.5rem)",
                transition: "flex-basis 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className={`flex min-w-[280px] gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:border-slate-600 ${
                hasLongDescription ? "cursor-pointer" : ""
              }`}
              onClick={() => hasLongDescription && toggleExpand(version.id)}
              onMouseEnter={() => hasLongDescription && setHoveredId(version.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Cover image */}
              <div className="flex-shrink-0">
                {version.coverImageUrl ? (
                  <div className="relative h-32 w-24 overflow-hidden rounded-lg bg-slate-900/50">
                    <Image
                      src={version.coverImageUrl}
                      alt={version.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-32 w-24 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Package className="h-8 w-8" style={{ color: accentColor }} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-white">{version.title}</h4>
                  {hasLongDescription && (
                    <ChevronDown
                      className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-300"
                      style={{
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  )}
                </div>
                {version.description && (
                  <div
                    className="mt-2 overflow-hidden"
                    style={{
                      maxHeight: isExpanded ? "500px" : "96px",
                      transition: "max-height 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <div className="space-y-1 text-sm text-slate-400">
                      {formatDescription(version.description)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
