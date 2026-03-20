"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Monitor, MessageSquare, Play, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameLanguage } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

interface GameDetailsTabLanguagesProps {
  languages?: GameLanguage[];
  colors: GameColors;
}

/** Language support section: interface, subtitles, voice. */
export function GameDetailsTabLanguages({ languages, colors }: GameDetailsTabLanguagesProps) {
  const tDetails = useTranslations("gameDetails");

  if (!languages || languages.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Languages className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p className="mb-2 text-lg font-medium text-white">{tDetails("languages.title")}</p>
        <p>{tDetails("languages.noData")}</p>
      </div>
    );
  }

  const categories = [
    {
      key: "interface",
      icon: Monitor,
      label: tDetails("languages.interface"),
      filter: (lang: GameLanguage) => lang.hasInterface,
    },
    {
      key: "subtitles",
      icon: MessageSquare,
      label: tDetails("languages.subtitles"),
      filter: (lang: GameLanguage) => lang.hasSubtitles,
    },
    {
      key: "voice",
      icon: Play,
      label: tDetails("languages.voice"),
      filter: (lang: GameLanguage) => lang.hasAudio,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {categories.map((cat) => {
        const CatIcon = cat.icon;
        const filtered = languages.filter(cat.filter);
        return (
          <Card
            key={cat.key}
            className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <CatIcon className="h-5 w-5" style={{ color: colors.accent }} />
                {cat.label}
              </h3>
              <div className="space-y-2">
                {filtered.length > 0 ? (
                  filtered.map((lang) => (
                    <div
                      key={`${cat.key}-${lang.code}`}
                      className="flex items-center gap-2 text-slate-300"
                    >
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      <span>{lang.nativeName ?? lang.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">{tDetails("languages.noData")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
