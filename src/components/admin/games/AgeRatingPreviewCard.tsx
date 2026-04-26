"use client";

import { Icon } from "@iconify/react";
import type { Rating, ContentDescriptor } from "@/types/admin-games";

export type ResolvedRating = Rating & { isPrimary: boolean; descriptors: ContentDescriptor[] };

export function AgeRatingPreviewCard({
  rating,
  colors,
}: {
  rating: ResolvedRating;
  colors: { backgroundColor: string; accent: string };
}) {
  return (
    <div
      className={`rounded-xl border border-slate-700 bg-slate-800/50 p-4 ${rating.isPrimary ? "ring-2" : ""}`}
      style={rating.isPrimary ? ({ "--tw-ring-color": colors.accent } as React.CSSProperties) : {}}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{
            backgroundColor: rating.color_hex ? `${rating.color_hex}30` : `${colors.accent}20`,
            color: rating.color_hex || colors.accent,
          }}
        >
          {rating.minimum_age !== null ? `${rating.minimum_age}+` : rating.code}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{rating.display_name}</span>
            {rating.isPrimary && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${colors.accent}30`, color: colors.accent }}
              >
                Principal
              </span>
            )}
          </div>
          {rating.system && <p className="text-xs text-slate-400">{rating.system.name}</p>}
        </div>
      </div>
      {rating.descriptors.length > 0 && (
        <div className="mt-3 border-t border-slate-700 pt-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Icon icon="lucide:alert-triangle" className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-medium text-slate-300">Avertissements</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {rating.descriptors.map((cd) => (
              <span
                key={cd.id}
                className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300"
              >
                {cd.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
