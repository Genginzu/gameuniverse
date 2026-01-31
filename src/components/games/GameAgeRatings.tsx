"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameRating } from "@/types/game";
import Image from "next/image";

interface GameAgeRatingsProps {
  ratings: GameRating[] | undefined;
  accentColor: string;
}

// Mapping des codes de rating vers les URLs d'images officielles
const RATING_IMAGES: Record<string, Record<string, string>> = {
  PEGI: {
    "3": "https://upload.wikimedia.org/wikipedia/commons/5/51/PEGI_3.svg",
    "7": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/PEGI_7.svg/200px-PEGI_7.svg.png",
    "12": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/PEGI_12.svg/200px-PEGI_12.svg.png",
    "16": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/PEGI_16.svg/200px-PEGI_16.svg.png",
    "18": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/PEGI_18.svg/200px-PEGI_18.svg.png",
  },
  ESRB: {
    E: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/ESRB_2013_Everyone.svg/200px-ESRB_2013_Everyone.svg.png",
    E10: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/ESRB_2013_Everyone_10%2B.svg/200px-ESRB_2013_Everyone_10%2B.svg.png",
    T: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/ESRB_2013_Teen.svg/200px-ESRB_2013_Teen.svg.png",
    M: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/ESRB_2013_Mature_17%2B.svg/200px-ESRB_2013_Mature_17%2B.svg.png",
    AO: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/ESRB_2013_Adults_Only_18%2B.svg/200px-ESRB_2013_Adults_Only_18%2B.svg.png",
    RP: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ESRB_2013_Rating_Pending.svg/200px-ESRB_2013_Rating_Pending.svg.png",
  },
  USK: {
    "0": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/USK_0.svg/200px-USK_0.svg.png",
    "6": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/USK_6.svg/200px-USK_6.svg.png",
    "12": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/USK_12.svg/200px-USK_12.svg.png",
    "16": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/USK_16.svg/200px-USK_16.svg.png",
    "18": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/USK_18.svg/200px-USK_18.svg.png",
  },
  CERO: {
    A: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/CERO_A.svg/200px-CERO_A.svg.png",
    B: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/CERO_B.svg/200px-CERO_B.svg.png",
    C: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/CERO_C.svg/200px-CERO_C.svg.png",
    D: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/CERO_D.svg/200px-CERO_D.svg.png",
    Z: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/CERO_Z.svg/200px-CERO_Z.svg.png",
  },
};

function getRatingImageUrl(
  systemCode: string,
  ratingCode: string,
  iconUrl?: string
): string | null {
  // Use provided iconUrl first
  if (iconUrl) return iconUrl;

  // Fallback to our mapping
  const systemImages = RATING_IMAGES[systemCode];
  if (systemImages && systemImages[ratingCode]) {
    return systemImages[ratingCode];
  }

  return null;
}

export function GameAgeRatings({ ratings, accentColor }: GameAgeRatingsProps) {
  const t = useTranslations("gameDetails.ageRatings");

  if (!ratings || ratings.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Shield className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p className="mb-2 text-lg font-medium text-white">{t("title")}</p>
        <p>{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ratings.map((rating, index) => {
          const imageUrl = getRatingImageUrl(rating.systemCode, rating.ratingCode, rating.iconUrl);

          return (
            <Card
              key={`${rating.systemCode}-${rating.ratingCode}-${index}`}
              className={`rounded-xl border-slate-700 bg-slate-800/50 ${rating.isPrimary ? "ring-2" : ""}`}
              style={rating.isPrimary ? { ringColor: accentColor } : {}}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Rating Image */}
                  <div className="flex-shrink-0">
                    {imageUrl ? (
                      <div className="relative h-20 w-16 overflow-hidden rounded-lg bg-slate-900/50">
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
                  <div className="mt-4 border-t border-slate-700 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-slate-300">
                        {t("contentDescriptors")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rating.contentDescriptors.map((descriptor, idx) => (
                        <span
                          key={`${descriptor.code}-${idx}`}
                          className="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-300"
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
