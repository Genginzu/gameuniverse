"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Music, Play, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameColors } from "@/lib/utils/game-utils";

interface GameDetailsTabMusicProps {
  colors: GameColors;
}

/** Music / soundtrack section with placeholder tracks. */
export function GameDetailsTabMusic({ colors }: GameDetailsTabMusicProps) {
  const tDetails = useTranslations("gameDetails");

  const placeholderTracks = [
    { title: "Main Theme", duration: "3:42" },
    { title: "Battle Music", duration: "2:58" },
    { title: "Ambient Theme", duration: "4:15" },
  ];

  return (
    <div className="space-y-8">
      <Card className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Music className="h-5 w-5" style={{ color: colors.accent }} />
            {tDetails("music.soundtrack")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {placeholderTracks.map((track) => (
              <div
                key={track.title}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{track.title}</h4>
                    <p className="text-sm text-slate-400">{track.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Users className="h-5 w-5" style={{ color: colors.accent }} />
            {tDetails("music.composer")}
          </h3>
          <div className="text-slate-300">
            <p className="mb-2">{tDetails("music.comingSoon")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
