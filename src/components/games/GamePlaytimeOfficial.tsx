"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, Gamepad2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { GamePlaytime as GamePlaytimeType } from "@/types/game";

interface GamePlaytimeOfficialProps {
  playtime: GamePlaytimeType | null | undefined;
  accentColor: string;
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return "-";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours}h`;
}

/**
 * Colonne gauche : les 3 cartes de temps de jeu officiel IGDB.
 */
export function GamePlaytimeOfficial({ playtime, accentColor }: GamePlaytimeOfficialProps) {
  const t = useTranslations("gameDetails.playtime");

  const hasAnyData = playtime?.hastily || playtime?.normally || playtime?.completely;

  if (!playtime || !hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="mb-4 h-12 w-12 opacity-50" />
        <p className="mb-2 text-lg font-medium text-white">{t("title")}</p>
        <p>{t("noData")}</p>
      </div>
    );
  }

  const cards = [
    { icon: Zap, label: t("hastily"), value: playtime.hastily },
    { icon: Gamepad2, label: t("normally"), value: playtime.normally },
    { icon: Trophy, label: t("completely"), value: playtime.completely },
  ] as const;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Clock className="h-5 w-5" style={{ color: accentColor }} />
        {t("title")}
      </h3>

      <div className="space-y-3">
        {cards.map(({ icon: IconComp, label, value }) => (
          <Card
            key={label}
            className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <IconComp className="h-5 w-5" style={{ color: accentColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400">{label}</p>
              </div>
              <p className="text-xl font-bold text-white">{formatHours(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
