"use client";

import { createContext, useContext } from "react";

import type { NavigationModel } from "@/types/navigation";

/**
 * Seam between the Navigation Model and the editorial renderers. Production
 * fills it with `EditorialNavigationProvider` (live hooks); tests fill it with
 * a model built by `resolveNavigation`.
 */
export const EditorialNavigationContext = createContext<NavigationModel | null>(null);

export function useEditorialNavigation(): NavigationModel {
  const model = useContext(EditorialNavigationContext);
  if (!model) {
    throw new Error("useEditorialNavigation must be used inside EditorialNavigationProvider");
  }
  return model;
}
