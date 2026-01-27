"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Gamepad2, Trophy, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { GamePlaytime as GamePlaytimeType } from "@/types/game";

interface GamePlaytimeProps {
  playtime: GamePlaytimeType | null | undefined;
  accentColor: string;
}

export function GamePlaytime({ playtime, accentColor }: GamePlaytimeProps) {
  const t = useTranslations("gameDetails.playtime");

  const formatHours = (hours: number | null): string => {
    if (hours === null || hours === undefined) return "-";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours}h`;
  };

  const hasAnyData = playtime?.main || playtime?.mainExtra || playtime?.completionist;

  if (!playtime || !hasAnyData) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p className="mb-2 text-lg font-medium text-white">{t("title")}</p>
        <p>{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Main Story */}
        <Card className="rounded-xl border-slate-700 bg-slate-800/50">
          <CardContent className="p-6">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Gamepad2 className="h-6 w-6" style={{ color: accentColor }} />
            </div>
            <p className="mb-1 text-sm text-slate-400">{t("mainStory")}</p>
            <p className="text-2xl font-bold text-white">{formatHours(playtime.main)}</p>
          </CardContent>
        </Card>

        {/* Main + Extras */}
        <Card className="rounded-xl border-slate-700 bg-slate-800/50">
          <CardContent className="p-6">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Target className="h-6 w-6" style={{ color: accentColor }} />
            </div>
            <p className="mb-1 text-sm text-slate-400">{t("mainExtras")}</p>
            <p className="text-2xl font-bold text-white">{formatHours(playtime.mainExtra)}</p>
          </CardContent>
        </Card>

        {/* Completionist */}
        <Card className="rounded-xl border-slate-700 bg-slate-800/50">
          <CardContent className="p-6">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Trophy className="h-6 w-6" style={{ color: accentColor }} />
            </div>
            <p className="mb-1 text-sm text-slate-400">{t("completionist")}</p>
            <p className="text-2xl font-bold text-white">{formatHours(playtime.completionist)}</p>
          </CardContent>
        </Card>

        {/* All Styles Average */}
        <Card className="rounded-xl border-slate-700 bg-slate-800/50">
          <CardContent className="p-6">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Clock className="h-6 w-6" style={{ color: accentColor }} />
            </div>
            <p className="mb-1 text-sm text-slate-400">{t("average")}</p>
            <p className="text-2xl font-bold text-white">{formatHours(playtime.allStyles)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Source attribution */}
      <p className="text-center text-xs text-slate-500">
        {t("source")}{" "}
        <a
          href="https://www.igdb.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white"
        >
          IGDB
        </a>
      </p>
    </div>
  );
}
