"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { GameColors } from "@/lib/utils/game-utils";

interface GameDetailsNavBarProps {
  locale?: string;
  colors?: GameColors;
}

export function GameDetailsNavBar(_props: GameDetailsNavBarProps = {}) {
  const t = useTranslations();

  return (
    <div className="absolute top-0 right-0 left-0 z-20 px-4 py-4">
      <div className="container mx-auto">
        <Link href="/games">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] border border-white/10 bg-white/5 px-4 text-slate-300 backdrop-blur-xl hover:bg-white/10 hover:text-white"
          >
            <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
