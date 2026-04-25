"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface GameHeroNavProps {
  isWishlisted: boolean;
  isWishlistToggling?: boolean;
  onWishlistToggle: () => void;
}

export function GameHeroNav({
  isWishlisted,
  isWishlistToggling = false,
  onWishlistToggle,
}: GameHeroNavProps) {
  const t = useTranslations();

  return (
    <div className="absolute top-0 right-0 left-0 z-20 px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/games">
          <Button
            variant="ghost"
            size="sm"
            className="bg-slate-900/60 text-slate-300 backdrop-blur-xs hover:bg-slate-900/80 hover:text-white"
          >
            <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="bg-slate-900/60 text-slate-300 backdrop-blur-xs hover:bg-slate-900/80 hover:text-white"
            aria-label={t("common.share")}
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            <Icon icon="lucide:share-2" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`cursor-pointer bg-slate-900/60 backdrop-blur-xs hover:bg-slate-900/80 hover:text-white ${isWishlisted ? "text-red-400" : "text-slate-300"}`}
            onClick={onWishlistToggle}
            disabled={isWishlistToggling}
            aria-label={isWishlisted ? t("games.removeFromWishlist") : t("games.addToWishlist")}
          >
            {isWishlistToggling ? (
              <Icon icon="svg-spinners:ring-resize" className="h-4 w-4" />
            ) : (
              <Icon
                icon="lucide:heart"
                className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`}
              />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
