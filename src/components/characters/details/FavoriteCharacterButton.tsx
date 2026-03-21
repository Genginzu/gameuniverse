"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
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

  // Skeleton pendant le chargement initial
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-slate-900/60 px-3 py-1.5 backdrop-blur-xs">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-5" />
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`cursor-pointer bg-slate-900/60 backdrop-blur-xs hover:bg-slate-900/80 hover:text-white ${
        isFavorite ? "text-red-400" : "text-slate-300"
      }`}
      onClick={toggleFavorite}
      disabled={isToggling}
      aria-label={
        isFavorite
          ? t("characters.favorites.removeFromFavorites")
          : t("characters.favorites.addToFavorites")
      }
    >
      {isToggling ? (
        <Icon icon="svg-spinners:ring-resize" className="h-4 w-4" />
      ) : (
        <Icon
          icon="lucide:heart"
          className="h-4 w-4 transition-transform"
          fill={isFavorite ? "currentColor" : "none"}
        />
      )}
      <span className="text-sm font-medium">{favoriteCount}</span>
    </Button>
  );
}
