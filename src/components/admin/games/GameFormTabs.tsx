"use client";

import type { Tab } from "@/types/admin-games";
import { Icon } from "@iconify/react";

export const BASE_TABS: Tab[] = [
  { id: "design", icon: <Icon icon="fa:paint-brush" className="h-3.5 w-3.5" />, labelKey: "design" },
  { id: "general", icon: <Icon icon="fa:info-circle" className="h-3.5 w-3.5" />, labelKey: "generalInfo" },
  { id: "images", icon: <Icon icon="fa:image" className="h-3.5 w-3.5" />, labelKey: "images" },
  { id: "translations", icon: <Icon icon="fa:globe" className="h-3.5 w-3.5" />, labelKey: "translations" },
  { id: "genres", icon: <Icon icon="fa:tag" className="h-3.5 w-3.5" />, labelKey: "genres" },
  { id: "companies", icon: <Icon icon="fa:building" className="h-3.5 w-3.5" />, labelKey: "companies" },
  { id: "game_platforms", icon: <Icon icon="fa:desktop" className="h-3.5 w-3.5" />, labelKey: "gamePlatforms" },
  { id: "age_ratings", icon: <Icon icon="lucide:shield" className="h-3.5 w-3.5" />, labelKey: "ageRatings" },
  { id: "versions", icon: <Icon icon="lucide:boxes" className="h-3.5 w-3.5" />, labelKey: "versions" },
  { id: "languages", icon: <Icon icon="fa:language" className="h-3.5 w-3.5" />, labelKey: "gameLanguages" },
  { id: "pricing", icon: <Icon icon="lucide:dollar-sign" className="h-3.5 w-3.5" />, labelKey: "pricing" },
  { id: "music", icon: <Icon icon="fa:music" className="h-3.5 w-3.5" />, labelKey: "music" },
  { id: "videos", icon: <Icon icon="fa:video-camera" className="h-3.5 w-3.5" />, labelKey: "videos" },
  { id: "similar_games", icon: <Icon icon="mdi:gamepad-variant-outline" className="h-3.5 w-3.5" />, labelKey: "similarGames" },
];

export const SYNC_TAB: Tab = {
  id: "sync",
  icon: <Icon icon="fa:sync" className="h-3.5 w-3.5" />,
  labelKey: "syncTab",
};
