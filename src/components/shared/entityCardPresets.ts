import type { EntityCardConfig } from "./EntityCard";
import { getMetascoreColor } from "./EntityCard"; // eslint-disable-line no-duplicate-imports
import type { GameSummary } from "@/types/game";
import type { PlayerSummary } from "@/types/player";
import type { CharacterSummary } from "@/types/character";
import { Badge } from "@/components/ui/badge";
import React from "react";

// Game Card Configuration
// Matches the current GameCard behavior exactly
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
  linkTemplate: (game) => `/games/${game.slug}`,
  // Custom hover renderer to match exact GameCard behavior
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

    return React.createElement(
      React.Fragment,
      null,
      // Title
      React.createElement(
        "h3",
        { className: "mb-2 line-clamp-2 text-lg font-bold text-white" },
        game.title
      ),

      // Developer & Publisher
      React.createElement(
        "div",
        { className: "mb-3 space-y-1 text-xs" },
        React.createElement(
          "div",
          { className: "flex items-center text-gray-300" },
          React.createElement(
            "span",
            { className: "font-medium text-gray-400" },
            t("developerShort"),
            ":"
          ),
          React.createElement("span", { className: "ml-1 font-medium text-white" }, game.developer)
        ),
        game.publisher !== game.developer &&
          React.createElement(
            "div",
            { className: "flex items-center text-gray-300" },
            React.createElement(
              "span",
              { className: "font-medium text-gray-400" },
              t("publisherShort"),
              ":"
            ),
            React.createElement(
              "span",
              { className: "ml-1 font-medium text-white" },
              game.publisher
            )
          )
      ),

      // Genres
      game.genres.length > 0 &&
        React.createElement(
          "div",
          { className: "mb-3 flex flex-wrap gap-1" },
          game.genres.slice(0, 2).map((genre, index) =>
            React.createElement(
              Badge,
              {
                key: index,
                variant: "secondary",
                className:
                  "rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs",
              },
              genre.name
            )
          ),
          game.genres.length > 2 &&
            React.createElement(
              Badge,
              {
                variant: "outline",
                className:
                  "rounded-full border-white/30 bg-white/10 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs",
              },
              `+${game.genres.length - 2}`
            )
        ),

      // Release Date
      game.releaseDate &&
        React.createElement(
          "div",
          { className: "flex items-center text-xs text-gray-300" },
          React.createElement(
            "svg",
            {
              className: "mr-1 h-3 w-3",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
            },
            React.createElement("path", {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            })
          ),
          game.releaseYear || formatReleaseDate(game.releaseDate)
        )
    );
  },
};

// Player Card Configuration
// Matches the current PlayerCard behavior exactly
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
  // Fallback avatar for players without avatar
  fallbackAvatarRenderer: () =>
    React.createElement(
      "svg",
      {
        className:
          "h-20 w-20 text-blue-300 transition-transform duration-500 group-hover:scale-110",
        fill: "currentColor",
        viewBox: "0 0 24 24",
      },
      React.createElement("path", {
        d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
      })
    ),
  // Custom hover renderer for player card
  customHoverRenderer: (player, t) => {
    const displayName = player.fullName || t("anonymousPlayer");
    return React.createElement(
      "div",
      { className: "w-full" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between" },
        React.createElement("span", { className: "text-sm font-medium text-white" }, displayName),
        React.createElement(
          "span",
          { className: "flex items-center text-xs text-gray-300" },
          React.createElement(
            "svg",
            {
              className: "mr-1 h-3 w-3",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
            },
            React.createElement("path", {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
            })
          ),
          player.gamesCount
        )
      ),
      React.createElement("div", { className: "mt-2 text-xs text-blue-400" }, t("viewProfile"))
    );
  },
};

// Character Card Configuration
// Matches the current CharacterCard behavior exactly
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
  // Custom hover renderer for character card
  customHoverRenderer: (character, t) => {
    return React.createElement(
      React.Fragment,
      null,
      // Name
      React.createElement(
        "h3",
        { className: "mb-2 line-clamp-2 text-lg font-bold text-white" },
        character.name
      ),

      // Description
      character.description &&
        React.createElement(
          "p",
          { className: "mb-3 line-clamp-2 text-sm leading-relaxed text-gray-200" },
          character.description
        ),

      // Primary Game
      React.createElement(
        "div",
        { className: "mb-3 space-y-1 text-xs" },
        React.createElement(
          "div",
          { className: "flex items-center text-gray-300" },
          React.createElement("span", { className: "font-medium text-gray-400" }, t("game")),
          React.createElement(
            "span",
            { className: "ml-1 font-medium text-white" },
            character.primaryGame
          )
        )
      ),

      // Games count
      React.createElement(
        "div",
        { className: "flex items-center text-xs text-gray-300" },
        React.createElement(
          "svg",
          { className: "mr-1 h-3 w-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
          React.createElement("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
          })
        ),
        t("games", { count: character.gamesCount })
      )
    );
  },
};
