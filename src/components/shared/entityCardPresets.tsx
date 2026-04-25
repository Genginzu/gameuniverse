import type { EntityCardConfig } from "./EntityCard";
import { getMetascoreColor } from "./EntityCard"; // eslint-disable-line no-duplicate-imports
import type { GameSummary } from "@/types/game";
import type { PlayerSummary } from "@/types/player";
import type { CharacterSummary } from "@/types/character";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";

// Game Card Configuration
export const gameCardConfig: EntityCardConfig<GameSummary> = {
  aspectRatio: "3:4",
  imageField: "coverImage",
  titleField: "title",
  descriptionField: "description",
  backgroundColorField: "backgroundColor",
  idField: "id",
  translationNamespace: "game",
  badge: {
    field: "metascore",
    position: "top-right",
    variant: "metascore",
    colorFn: getMetascoreColor,
  },
  hoverOverlay: {
    enabled: true,
    showTitle: true,
    showDescription: true,
    fields: [],
  },
  actions: {
    libraryToggle: true,
  },
  customBadgeRenderer: (game) =>
    game.isEsport ? (
      <div className="absolute top-3 left-3 z-20">
        <Badge className="from-palette-secondary-500 to-palette-primary-500 rounded-full bg-linear-to-r px-2 py-0.5 text-xs font-bold text-white shadow-lg">
          Esport
        </Badge>
      </div>
    ) : null,
  linkTemplate: (game) => `/games/${game.slug}`,
  customHoverRenderer: (game, t) => {
    const formatReleaseDate = (dateString?: string, locale: string = "fr") => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    };

    return (
      <>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{game.title}</h3>
        <div className="mb-3 space-y-1 text-xs">
          <div className="flex items-center text-gray-300">
            <span className="font-medium text-gray-400">{t("developerShort")}:</span>
            <span className="ml-1 font-medium text-white">{game.developer}</span>
          </div>
          {game.publisher !== game.developer && (
            <div className="flex items-center text-gray-300">
              <span className="font-medium text-gray-400">{t("publisherShort")}:</span>
              <span className="ml-1 font-medium text-white">{game.publisher}</span>
            </div>
          )}
        </div>
        {game.genres.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {game.genres.slice(0, 2).map((genre, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs"
              >
                {genre.name}
              </Badge>
            ))}
            {game.genres.length > 2 && (
              <Badge
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs"
              >
                +{game.genres.length - 2}
              </Badge>
            )}
          </div>
        )}
        {game.releaseDate && (
          <div className="flex items-center text-xs text-gray-300">
            <Icon icon="lucide:calendar" className="mr-1 h-3 w-3" />
            {game.releaseYear || formatReleaseDate(game.releaseDate)}
          </div>
        )}
      </>
    );
  },
};

// Player Card Configuration
export const playerCardConfig: EntityCardConfig<PlayerSummary> = {
  aspectRatio: "1:1",
  imageField: "avatarUrl",
  titleField: "fullName",
  idField: "id",
  translationNamespace: "players.card",
  badge: {
    field: "gamesCount",
    position: "top-right",
    variant: "count",
  },
  hoverOverlay: {
    enabled: true,
    showTitle: false,
    showDescription: false,
    fields: [],
  },
  actions: {},
  linkTemplate: (player) => `/players/${player.id}`,
  fallbackAvatarRenderer: () => (
    <Icon
      icon="lucide:user"
      className="h-20 w-20 text-blue-300 transition-transform duration-500 group-hover:scale-110"
    />
  ),
  customHoverRenderer: (player, t) => {
    const displayName = player.fullName || t("anonymousPlayer");
    return (
      <div className="w-full">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{displayName}</span>
          <span className="flex items-center text-xs text-gray-300">
            <Icon icon="lucide:gamepad-2" className="mr-1 h-3 w-3" />
            {player.gamesCount}
          </span>
        </div>
        <div className="mt-2 text-xs text-blue-400">{t("viewProfile")}</div>
      </div>
    );
  },
};

// Character Card Configuration
export const characterCardConfig: EntityCardConfig<CharacterSummary> = {
  aspectRatio: "3:4",
  imageField: "mainImage",
  titleField: "name",
  descriptionField: "description",
  backgroundColorField: "backgroundColor",
  idField: "id",
  translationNamespace: "characters.card",
  badge: {
    field: "role",
    position: "top-right",
    variant: "role",
  },
  hoverOverlay: {
    enabled: true,
    showTitle: true,
    showDescription: true,
    fields: [],
  },
  actions: {
    characterFavoriteToggle: true,
  },
  linkTemplate: (character) => `/characters/${character.slug}`,
  slugField: "slug",
  fallbackAvatarRenderer: () => (
    <Icon
      icon="lucide:user"
      className="h-20 w-20 text-blue-300 transition-transform duration-500 group-hover:scale-110"
    />
  ),
  customHoverRenderer: (character, t) => {
    return (
      <>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{character.name}</h3>
        {character.description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-200">
            {character.description}
          </p>
        )}
        <div className="mb-3 space-y-1 text-xs">
          <div className="flex items-center text-gray-300">
            <span className="font-medium text-gray-400">{t("game")}</span>
            <span className="ml-1 font-medium text-white">{character.primaryGame}</span>
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-300">
          <Icon icon="lucide:gamepad-2" className="mr-1 h-3 w-3" />
          {t("games", { count: character.gamesCount })}
        </div>
      </>
    );
  },
};
