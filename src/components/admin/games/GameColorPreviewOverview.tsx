"use client";

import { Calendar, Users, Globe, Info, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { getMetascoreColor, type GameColors } from "@/lib/utils/game-utils";

interface PreviewOverviewProps {
  colors: GameColors;
  developers: string[];
  publishers: string[];
  formattedDate: string | null;
  metascore: number | null;
  genres: { id: string; name: string }[];
}

/**
 * Overview cards section of the color preview, matching the real GameOverviewSection.
 * Shows: Développeur, Éditeur, Date de sortie, Metascore, Genres.
 */
export function GameColorPreviewOverview({
  colors,
  developers,
  publishers,
  formattedDate,
  metascore,
  genres,
}: PreviewOverviewProps) {
  const t = useTranslations();
  const tDetails = useTranslations("gameDetails");

  const labelStyle = { color: colors.labelColor };
  const textStyle = { color: colors.textColor };

  return (
    <div className="px-5 pb-5">
      <h3 className="mb-3 text-sm font-bold" style={textStyle}>
        {tDetails("overview")}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {/* Developers */}
        <OverviewCard
          icon={<Users className="h-3.5 w-3.5" />}
          label={t("game.developer")}
          colors={colors}
        >
          {developers.length > 0 ? (
            developers.map((name) => (
              <div key={name} className="text-xs font-medium" style={textStyle}>
                {name}
              </div>
            ))
          ) : (
            <div className="text-xs italic opacity-40" style={textStyle}>
              —
            </div>
          )}
        </OverviewCard>

        {/* Publishers */}
        <OverviewCard
          icon={<Globe className="h-3.5 w-3.5" />}
          label={t("game.publisher")}
          colors={colors}
        >
          {publishers.length > 0 ? (
            publishers.map((name) => (
              <div key={name} className="text-xs font-medium" style={textStyle}>
                {name}
              </div>
            ))
          ) : (
            <div className="text-xs italic opacity-40" style={textStyle}>
              —
            </div>
          )}
        </OverviewCard>

        {/* Release date */}
        <OverviewCard
          icon={<Calendar className="h-3.5 w-3.5" />}
          label={t("game.releaseDate")}
          colors={colors}
        >
          <div className="text-xs font-medium" style={textStyle}>
            {formattedDate ?? "—"}
          </div>
        </OverviewCard>

        {/* Metascore */}
        {metascore !== null && metascore !== undefined && (
          <OverviewCard icon={<Star className="h-3.5 w-3.5" />} label="Metascore" colors={colors}>
            <div className="flex items-center gap-1.5">
              <span
                className={`${getMetascoreColor(metascore)} rounded-md px-2 py-0.5 text-xs font-bold text-white`}
              >
                {metascore}
              </span>
              <span className="text-[10px]" style={labelStyle}>
                {metascore >= 90
                  ? tDetails("metascoreRatings.exceptional")
                  : metascore >= 75
                    ? tDetails("metascoreRatings.excellent")
                    : metascore >= 60
                      ? tDetails("metascoreRatings.good")
                      : metascore >= 40
                        ? tDetails("metascoreRatings.average")
                        : tDetails("metascoreRatings.poor")}
              </span>
            </div>
          </OverviewCard>
        )}

        {/* Genres */}
        {genres.length > 0 && (
          <OverviewCard
            icon={<Info className="h-3.5 w-3.5" />}
            label={t("game.genres")}
            colors={colors}
          >
            <div className="flex flex-wrap gap-1">
              {genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px]"
                  style={labelStyle}
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </OverviewCard>
        )}
      </div>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  colors,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  colors: GameColors;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span style={{ color: colors.accent }}>{icon}</span>
        <span className="text-[11px]" style={{ color: colors.labelColor }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
