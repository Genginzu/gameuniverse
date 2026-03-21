"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { GameRating } from "@/types/game";
import Image from "next/image";

interface GameAgeRatingsProps {
  ratings: GameRating[] | undefined;
  accentColor: string;
}

export function GameAgeRatings({ ratings, accentColor }: GameAgeRatingsProps) {
  const t = useTranslations("gameDetails.ageRatings");

  if (!ratings || ratings.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Icon icon="lucide:shield" className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p className="mb-2 text-lg font-medium text-white">{t("title")}</p>
        <p>{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ratings.map((rating, index) => {
          // Only use IGDB icon_url, no fallback to external sources
          const imageUrl = rating.iconUrl || null;

          return (
            <Card
              key={`${rating.systemCode}-${rating.ratingCode}-${index}`}
              className={`rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl ${rating.isPrimary ? "ring-2" : ""}`}
              style={
                rating.isPrimary ? ({ "--tw-ring-color": accentColor } as React.CSSProperties) : {}
              }
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Rating Image - only from IGDB or text fallback */}
                  <div className="shrink-0">
                    {imageUrl ? (
                      <div className="relative h-20 w-16 overflow-hidden rounded-lg bg-white/5">
                        <Image
                          src={imageUrl}
                          alt={rating.rating}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-20 w-16 items-center justify-center rounded-lg text-2xl font-bold"
                        style={{
                          backgroundColor: rating.colorHex
                            ? `${rating.colorHex}30`
                            : `${accentColor}20`,
                          color: rating.colorHex || accentColor,
                        }}
                      >
                        {rating.minimumAge !== undefined
                          ? `${rating.minimumAge}+`
                          : rating.ratingCode}
                      </div>
                    )}
                  </div>

                  {/* Rating Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-white">{rating.rating}</h3>
                      {rating.isPrimary && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                        >
                          {t("primary")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{rating.system}</p>
                    {rating.minimumAge !== undefined && (
                      <p className="mt-1 text-sm text-slate-300">
                        {t("minimumAge", { age: rating.minimumAge })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content Descriptors */}
                {rating.contentDescriptors && rating.contentDescriptors.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon icon="lucide:alert-triangle" className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-slate-300">
                        {t("contentDescriptors")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rating.contentDescriptors.map((descriptor, idx) => (
                        <span
                          key={`${descriptor.code}-${idx}`}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                          title={descriptor.description || undefined}
                        >
                          {descriptor.name || descriptor.code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
