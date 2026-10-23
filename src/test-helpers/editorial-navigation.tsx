import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";

import { EditorialNavigationContext } from "@/hooks/useEditorialNavigation";
import { resolveNavigation } from "@/lib/navigation";
import type { NavigationInput, NavigationModel, NavTranslate } from "@/types/navigation";

/** Translator returning the dictionary entry, or the key itself. */
export function dictionaryTranslator(dictionary: Record<string, string> = {}): NavTranslate {
  return (key) => dictionary[key] ?? key;
}

export function buildNavigation(
  input: Partial<NavigationInput> = {},
  translate: NavTranslate = dictionaryTranslator()
): NavigationModel {
  return resolveNavigation({ pathname: "/", isAuthenticated: false, ...input }, translate);
}

export function NavigationTestProvider({
  model,
  children,
}: {
  model: NavigationModel;
  children: ReactNode;
}) {
  return (
    <EditorialNavigationContext.Provider value={model}>
      {children}
    </EditorialNavigationContext.Provider>
  );
}

/** Renders `ui` against a Navigation Model resolved from `input`. */
export function renderWithNavigation(
  ui: ReactElement,
  input: Partial<NavigationInput> = {},
  translate?: NavTranslate
) {
  const model = buildNavigation(input, translate);
  return render(<NavigationTestProvider model={model}>{ui}</NavigationTestProvider>);
}
