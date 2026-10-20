import type { ReactNode } from "react";
import {
  createTranslator,
  type AbstractIntlMessages,
  type RichTranslationValues,
} from "next-intl";

/**
 * Legal page texts live in `src/messages/legal/<locale>.json`, outside the
 * main catalogues: they are rendered by server components only, so keeping
 * them out of `getMessages()` avoids shipping ~40 KB of legal prose to the
 * client on every page.
 */
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  fr: () => import("@/messages/legal/fr.json"),
  en: () => import("@/messages/legal/en.json"),
};

export type LegalPage = "mentionsLegales" | "confidentialite" | "cookies" | "cgv" | "cgu";

export async function getLegalTranslator(locale: string): Promise<LegalTranslator> {
  const loader = LOADERS[locale] ?? LOADERS.fr;
  const messages = (await loader()).default as AbstractIntlMessages;
  // Keys are resolved dynamically from the JSON structure, so the strictly
  // typed translator is widened to plain string keys.
  return createTranslator({ locale, messages }) as unknown as LegalTranslator;
}

export interface LegalTranslator {
  (key: string): string;
  rich(key: string, values?: RichTranslationValues): ReactNode;
  raw(key: string): unknown;
}
