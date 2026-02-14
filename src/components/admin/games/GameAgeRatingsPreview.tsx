"use client";

import { type UseFormReturn } from "react-hook-form";
import { Shield, AlertTriangle } from "lucide-react";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { Rating, ContentDescriptor } from "@/types/admin-games";
import { buildGameColors } from "@/lib/utils/game-utils";

interface GameAgeRatingsPreviewProps {
  form: UseFormReturn<AdminGameFormData>;
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
}

/**
 * Live preview of age rating cards as they appear on the public game page.
 * Watches form age_ratings + color fields and renders a representation
 * matching the GameAgeRatings component.
 */
export function GameAgeRatingsPreview({
  form,
  ratings,
  contentDescriptors,
}: GameAgeRatingsPreviewProps) {
  const watchedRatings = form.watch("age_ratings");
  const bgColorRaw = form.watch("background_color");
  const accentColorRaw = form.watch("accent_color");

  const colors = buildGameColors({
    backgroundColor: bgColorRaw || undefined,
    accentColor: accentColorRaw || undefined,
  });

  const resolvedRatings = watchedRatings
    .map((wr) => {
      const rating = ratings.find((r) => r.id === wr.rating_id);
      if (!rating) return null;
      const descriptors = wr.content_descriptors
        .map((cdId) => contentDescriptors.find((cd) => cd.id === cdId))
        .filter(Boolean) as ContentDescriptor[];
      return { ...rating, isPrimary: wr.is_primary, descriptors };
    })
    .filter(Boolean) as (Rating & { isPrimary: boolean; descriptors: ContentDescriptor[] })[];

  if (resolvedRatings.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-gray-200/60 py-8 dark:border-gray-700/40"
        style={{ backgroundColor: colors.backgroundColor }}
      >
        <Shield className="mb-2 h-8 w-8 text-slate-400 opacity-50" />
        <p className="text-xs text-slate-400">Aucune classification</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 rounded-xl border border-gray-200/60 p-4 dark:border-gray-700/40"
      style={{ backgroundColor: colors.backgroundColor }}
      data-testid="age-ratings-preview"
    >
      {resolvedRatings.map((rating) => (
        <div
          key={rating.id}
          className={`rounded-xl border border-slate-700 bg-slate-800/50 p-4 ${
            rating.isPrimary ? "ring-2" : ""
          }`}
          style={
            rating.isPrimary ? ({ "--tw-ring-color": colors.accent } as React.CSSProperties) : {}
          }
        >
          <div className="flex items-start gap-3">
            {/* Rating badge */}
            <div
              className="flex h-12 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
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
                    style={{
                      backgroundColor: `${colors.accent}30`,
                      color: colors.accent,
                    }}
                  >
                    Principal
                  </span>
                )}
              </div>
              {rating.system && <p className="text-xs text-slate-400">{rating.system.name}</p>}
            </div>
          </div>

          {/* Content descriptors */}
          {rating.descriptors.length > 0 && (
            <div className="mt-3 border-t border-slate-700 pt-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
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
      ))}
    </div>
  );
}
