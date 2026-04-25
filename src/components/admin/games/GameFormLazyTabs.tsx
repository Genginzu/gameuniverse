"use client";

import { lazy } from "react";

export const GameFormDesignTab = lazy(() =>
  import("./GameFormDesignTab").then((m) => ({ default: m.GameFormDesignTab }))
);
export const GameFormGeneralTab = lazy(() =>
  import("./GameFormGeneralTab").then((m) => ({ default: m.GameFormGeneralTab }))
);
export const GameFormImagesTab = lazy(() =>
  import("./GameFormImagesTab").then((m) => ({ default: m.GameFormImagesTab }))
);
export const GameFormTranslationsTab = lazy(() =>
  import("./GameFormTranslationsTab").then((m) => ({ default: m.GameFormTranslationsTab }))
);
export const GameFormGenresTab = lazy(() =>
  import("./GameFormGenresTab").then((m) => ({ default: m.GameFormGenresTab }))
);
export const GameFormCompaniesTab = lazy(() =>
  import("./GameFormCompaniesTab").then((m) => ({ default: m.GameFormCompaniesTab }))
);
export const GameFormPlatformsTab = lazy(() =>
  import("./GameFormPlatformsTab").then((m) => ({ default: m.GameFormPlatformsTab }))
);
export const GameFormAgeRatingsTab = lazy(() =>
  import("./GameFormAgeRatingsTab").then((m) => ({ default: m.GameFormAgeRatingsTab }))
);
export const GameFormVersionsTab = lazy(() =>
  import("./GameFormVersionsTab").then((m) => ({ default: m.GameFormVersionsTab }))
);
export const GameFormLanguagesTab = lazy(() =>
  import("./GameFormLanguagesTab").then((m) => ({ default: m.GameFormLanguagesTab }))
);
export const GameFormPricingTab = lazy(() =>
  import("./GameFormPricingTab").then((m) => ({ default: m.GameFormPricingTab }))
);
export const GameFormMusicTab = lazy(() =>
  import("./GameFormMusicTab").then((m) => ({ default: m.GameFormMusicTab }))
);
export const GameFormVideosTab = lazy(() =>
  import("./GameFormVideosTab").then((m) => ({ default: m.GameFormVideosTab }))
);
export const GameFormSyncTab = lazy(() =>
  import("./GameFormSyncTab").then((m) => ({ default: m.GameFormSyncTab }))
);
export const GameFormSimilarGamesTab = lazy(() =>
  import("./GameFormSimilarGamesTab").then((m) => ({ default: m.GameFormSimilarGamesTab }))
);
