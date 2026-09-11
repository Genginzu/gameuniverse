/**
 * Bun test setup: React Testing Library cleanup + Next.js mocks + polyfills.
 * happy-dom globals are registered in test/happydom.ts (first preload).
 * This file is the second preload, so document/window are already available.
 */

import { afterEach, vi, mock } from "bun:test";
import React from "react";
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";

// ── Vitest API polyfills for Bun:test ──────────────────────────────
// vi.hoisted: Bun's mock.module() overrides even already-imported
// modules, so no hoisting is needed — just call the factory immediately.
(vi as any).hoisted = <T>(factory: () => T): T => factory();

// vi.mocked: type-only helper in Vitest, no runtime effect.
(vi as any).mocked = <T>(fn: T): T => fn;

// vi.stubGlobal: assign a value on the global scope (writable).
(vi as any).stubGlobal = (key: string, value: unknown): void => {
  try {
    (globalThis as any)[key] = value;
  } catch {
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  }
};

// vi.stubEnv: assign a value on process.env.
(vi as any).stubEnv = (key: string, value: string): void => {
  process.env[key] = value;
};

// vi.importActual: dynamic import of the real module (not mocked).
(vi as any).importActual = async (path: string): Promise<unknown> => {
  return import(path);
};

// vi.setSystemTime: delegate to Bun's setSystemTime.
(vi as any).setSystemTime = (date?: Date): void => {
  const { setSystemTime } = require("bun:test");
  setSystemTime(date);
};

// vi.useFakeTimers: delegate to jest.useFakeTimers (Bun provides it).
(vi as any).useFakeTimers = (): void => {
  const { jest } = require("bun:test");
  jest.useFakeTimers();
};

// vi.useRealTimers: delegate to jest.useRealTimers.
(vi as any).useRealTimers = (): void => {
  const { jest } = require("bun:test");
  jest.useRealTimers();
};

// vi.resetModules: no-op in Bun (module cache is reset per file with --isolate).
(vi as any).resetModules = (): void => {};

// vi.unmock: no-op (Bun doesn't auto-mock, so nothing to undo).
(vi as any).unmock = (): void => {};

// vi.doUnmock: alias to vi.unmock.
(vi as any).doUnmock = (vi as any).unmock;

// Wrap vi.mock to use mock.module() (Bun's native vi.mock doesn't override
// already-imported modules, but mock.module() does).
vi.mock = (path: string, factory?: (...args: any[]) => any) => {
  return mock.module(path as any, factory as any);
};

// vi.doMock: alias to the wrapped vi.mock.
(vi as any).doMock = vi.mock;
// ── End polyfills ───────────────────────────────────────────────────

// Mock TtlCache as a no-op cache (always miss) so that module-level caches
// in esport services don't persist between tests (Bun has no resetModules).
vi.mock("@/lib/services/esport/ttlCache", () => ({
  TtlCache: class {
    get() {
      return null;
    }
    set() {}
    clear() {}
    size = 0;
  },
}));

// Make happy-dom globals redefinable (some tests reassign document/window).
for (const key of ["document", "window", "localStorage", "sessionStorage", "navigator"]) {
  try {
    const desc = Object.getOwnPropertyDescriptor(globalThis, key);
    if (desc) {
      // Convert accessor properties (getter-only) to writable data properties.
      if (desc.get || desc.set) {
        Object.defineProperty(globalThis, key, {
          value: desc.get ? desc.get.call(globalThis) : undefined,
          writable: true,
          configurable: true,
        });
      } else if (!desc.configurable || !desc.writable) {
        Object.defineProperty(globalThis, key, { ...desc, configurable: true, writable: true });
      }
    }
  } catch {
    // ignore if not present
  }
}

afterEach(() => {
  cleanup();
  if (typeof document !== "undefined" && document?.body) {
    document.body.innerHTML = "";
  }
});

// Polyfills for browser APIs used by components
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

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
      filter: "Filtrer",
    };
    return translations[key] || key;
  },
  useLocale: () => "fr",
  useMessages: () => ({}),
  useFormatter: () => (value: string) => value,
  useNow: () => new Date(),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
