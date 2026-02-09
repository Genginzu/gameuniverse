// Test setup file for Bun
// This file is loaded before all tests

import { mock } from "bun:test";
import React from "react";

// Mock next/headers before any imports that might use it
mock.module("next/headers", () => ({
  cookies: () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
  headers: () => new Map(),
}));

// Mock next/navigation to avoid React.createContext issues
// Export mockPush for tests that need to verify navigation calls
const mockRouterPush = mock(() => {});
const mockRouterReplace = mock(() => {});

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: mock(() => {}),
  permanentRedirect: mock(() => {}),
  notFound: mock(() => {}),
}));

// Export router mocks to global for test control
(
  global as typeof globalThis & {
    __routerMocks: {
      push: typeof mockRouterPush;
      replace: typeof mockRouterReplace;
    };
  }
).__routerMocks = {
  push: mockRouterPush,
  replace: mockRouterReplace,
};

// Mock next/image to avoid React context issues
mock.module("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return React.createElement("img", { ...props, alt: props.alt || "" });
  },
}));

// Mock next/link
mock.module("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    return React.createElement("a", { href, ...props }, children);
  },
}));

// Mock next-intl for internationalization
mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => {
    // Comprehensive translations for all tests
    const translations: Record<string, string> = {
      // Common / Search
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
      // Library
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

// Create controllable mock functions for browser Supabase client
// These are exported so tests can control them via globalThis
const browserMockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));
const browserMockSingle = mock(() => Promise.resolve({ data: null, error: null }));
const browserMockEq = mock(() => ({ single: browserMockSingle }));
const browserMockSelect = mock(() => ({ eq: browserMockEq }));
const browserMockFrom = mock(() => ({ select: browserMockSelect }));

const browserSupabaseClient = {
  auth: {
    getUser: browserMockGetUser,
    getSession: mock(() => Promise.resolve({ data: { session: null }, error: null })),
    signOut: mock(() => Promise.resolve({ error: null })),
  },
  from: browserMockFrom,
  rpc: mock(() => Promise.resolve({ data: null, error: null })),
};

// Export mocks to global for test control
(
  global as typeof globalThis & {
    __supabaseMocks: {
      getUser: typeof browserMockGetUser;
      single: typeof browserMockSingle;
      eq: typeof browserMockEq;
      select: typeof browserMockSelect;
      from: typeof browserMockFrom;
    };
  }
).__supabaseMocks = {
  getUser: browserMockGetUser,
  single: browserMockSingle,
  eq: browserMockEq,
  select: browserMockSelect,
  from: browserMockFrom,
};

// Mock the browser Supabase client
mock.module("@/lib/supabase", () => ({
  createClient: () => browserSupabaseClient,
}));

// Mock @supabase/ssr createServerClient for server-side tests
const mockSupabaseClient = {
  auth: {
    getSession: mock(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser: mock(() => Promise.resolve({ data: { user: null }, error: null })),
  },
  from: mock(() => ({
    select: mock(() => ({
      eq: mock(() => ({
        single: mock(() => Promise.resolve({ data: null, error: null })),
      })),
      ilike: mock(() => Promise.resolve({ data: [], error: null })),
      in: mock(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
  rpc: mock(() => Promise.resolve({ data: null, error: null })),
};

mock.module("@supabase/ssr", () => ({
  createBrowserClient: mock(() => mockSupabaseClient),
  createServerClient: mock(() => mockSupabaseClient),
}));

// Mock the supabase-server module using the alias path that matches imports
mock.module("@/lib/supabase-server", () => ({
  createServerClient: mock(async () => mockSupabaseClient),
  createRouteHandlerClient: mock(async () => mockSupabaseClient),
}));

import "@testing-library/jest-dom";

// Setup DOM environment for React components testing
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
  resources: "usable",
});

global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Add missing DOM globals
global.DocumentFragment = dom.window.DocumentFragment;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLSpanElement = dom.window.HTMLSpanElement;
global.HTMLFormElement = dom.window.HTMLFormElement;
global.Node = dom.window.Node;
global.Text = dom.window.Text;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.CustomEvent = dom.window.CustomEvent;
global.MutationObserver = dom.window.MutationObserver;
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Next.js router for testing
const mockRouter = {
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: "/",
  query: {},
  asPath: "/",
  route: "/",
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
};

// Make router available globally for tests
(global as typeof globalThis & { mockRouter: typeof mockRouter }).mockRouter = mockRouter;

// Add any other global test setup here
console.warn("Test setup completed with Bun runtime");
