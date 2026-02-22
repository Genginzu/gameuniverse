"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameColors } from "@/lib/utils/game-utils";

interface GameDetailsNavBarProps {
  locale: string;
  colors: GameColors;
}

export function GameDetailsNavBar({ locale }: GameDetailsNavBarProps) {
  const t = useTranslations();

  return (
    <div className="absolute left-0 right-0 top-0 z-20 px-4 py-4">
      <div className="container mx-auto">
        <Link href={`/${locale}/games`}>
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/10 bg-white/5 text-slate-300 backdrop-blur-xl hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
