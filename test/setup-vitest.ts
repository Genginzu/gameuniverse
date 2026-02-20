/**
 * Vitest setup for UI/component tests.
 * Vitest handles jsdom natively via environment: 'jsdom' in vitest.config.ts.
 * No manual global.window assignment needed.
 */

import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom/vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
  headers: () => new Map(),
}));

// Mock next/navigation
export const mockRouterPush = vi.fn();
export const mockRouterReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", { ...props, alt: props.alt || "" }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
}));

// Mock next-intl/navigation — prevents ESM resolution error on next/navigation
vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
      React.createElement("a", { href, ...props }, children),
    redirect: vi.fn(),
    usePathname: () => "/",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }),
    getPathname: vi.fn(),
  }),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      placeholder: "Search games...",
      loading: "Loading...",
      noResults: "No results found",
      seeAll: "See all results",
      importing: "Importing...",
      "source.local": "Local",
      "source.igdb": "IGDB",
      previous: "Précédent",
      next: "Suivant",
      page: "Page",
      of: "sur",
      showing: "Affichage",
      results: "résultats",
      heroTitle: "Ma Bibliothèque",
      heroTitleHighlight: "de Jeux",
      heroSubtitle: "Gérez votre collection de jeux",
      "stats.gamesOwned": "Jeux possédés",
      "stats.inLibrary": "dans la bibliothèque",
      "stats.gamesCompleted": "Jeux terminés",
      "stats.completedPercent": "terminés",
      "stats.playTime": "Temps de jeu",
      "stats.totalPlayed": "heures jouées",
      "stats.averageRating": "Note moyenne",
      "stats.yourRatings": "vos notes",
      "empty.title": "Bibliothèque vide",
      "empty.description": "Commencez à ajouter des jeux",
      "empty.noGamesFound": "Aucun jeu trouvé",
      "empty.modifySearch": "Modifiez votre recherche",
      "empty.clearFilters": "Effacer les filtres",
      "empty.exploreGames": "Explorer les jeux",
      loadingError: "Erreur de chargement",
      loadingErrorDescription: "Impossible de charger les jeux",
    };
    return translations[key] || key;
  },
  useLocale: () => "fr",
  useMessages: () => ({}),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
