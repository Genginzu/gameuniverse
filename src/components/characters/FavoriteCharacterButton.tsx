"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useCharacterFavorite } from "@/hooks/useCharacterFavorite";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface FavoriteCharacterButtonProps {
  characterSlug: string;
}

export function FavoriteCharacterButton({ characterSlug }: FavoriteCharacterButtonProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const { isFavorite, favoriteCount, isLoading, isToggling, toggleFavorite } =
    useCharacterFavorite(characterSlug);

  // Requirement 1.3: hidden if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`bg-slate-900/60 backdrop-blur-xs hover:bg-slate-900/80 hover:text-white ${
        isFavorite ? "text-red-400" : "text-slate-300"
      }`}
      onClick={toggleFavorite}
      disabled={isLoading || isToggling}
      aria-label={
        isFavorite
          ? t("characters.favorites.removeFromFavorites")
          : t("characters.favorites.addToFavorites")
      }
    >
      <Heart
        className={`h-4 w-4 transition-transform ${isToggling ? "scale-110" : ""}`}
        fill={isFavorite ? "currentColor" : "none"}
      />
      <span className="text-sm font-medium">{favoriteCount}</span>
    </Button>
  );
}
