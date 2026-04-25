---
name: nextjs-app-router
description:
  Patterns Next.js App Router du projet — routing, layouts, server/client
  components, i18n, middleware. Activer quand on crée des pages, layouts ou
  qu'on travaille sur le routing.
---

# Skill : Expert Next.js App Router — GameUniverse

## Routing i18n

Toutes les pages sous `src/app/[locale]/`. Deux layouts :

- `src/app/[locale]/` — pages publiques (wrappées dans `<DashboardLayout>`)
- `src/app/[locale]/admin/` — pages admin (wrappées via `<AdminLayout>`)

API routes dans `src/app/api/` (hors du segment `[locale]`).

## 3 Patterns de Pages

### Pattern A — Page client pure

```tsx
"use client";
export default function Page() {
  return (
    <DashboardLayout>
      <Content />
    </DashboardLayout>
  );
}
```

Usage : pages simples, admin.

### Pattern B — Page serveur async (SEO)

```tsx
export default async function Page({ params }) {
  const { locale, slug } = await params; // Next 15 : params est une Promise
  const data = await Service.fetch(slug, locale);
  if (!data) notFound();
  return <DashboardLayout>
    <Suspense fallback={<Skeleton />}><Content data={data} /></Suspense>
  </DashboardLayout>;
}
export async function generateMetadata({ params }) { ... }
```

Usage : pages de détail avec SEO.

### Pattern C — Server avec initial data + fallback client

```tsx
export default async function Page({ params }) {
  const { locale } = await params;
  let initialData;
  try {
    initialData = await Service.fetch({ locale });
  } catch {
    /* client fallback */
  }
  return (
    <DashboardLayout>
      <Content initialData={initialData} locale={locale} />
    </DashboardLayout>
  );
}
```

Usage : listes avec SSR initial.

## Middleware (`src/proxy.ts`)

i18n uniquement, pas d'auth :

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
export default createMiddleware(routing);
export const config = { matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)" };
```

## i18n (next-intl)

- Locales : `fr` (default), `en`
- Config : `src/i18n/routing.ts`, `src/i18n.ts`
- Messages : `src/messages/fr.json`, `src/messages/en.json`

```tsx
// Client component
import { useTranslations } from "next-intl";
const t = useTranslations("namespace");

// Server component
import { getTranslations } from "next-intl/server";
const t = await getTranslations("namespace");

// Navigation (TOUJOURS utiliser ceux-ci, pas next/navigation)
import { Link, useRouter, usePathname } from "@/i18n/navigation";
```

## Layouts imbriqués

1. `src/app/layout.tsx` — Root (html/body, ThemeProvider, fonts)
2. `src/app/[locale]/layout.tsx` — Locale (async server, NextIntlClientProvider,
   SWRProvider, ErrorProvider)
3. `src/app/[locale]/admin/layout.tsx` — Admin (`"use client"`, AdminLayout)

## Fichiers spéciaux existants

- `loading.tsx` : uniquement `admin/loading.tsx` (manque sur les pages
  publiques)
- `error.tsx` : racine locale, admin, characters, characters/[slug], players
- `not-found.tsx` : admin, players/[id]
- `global-error.tsx` : racine app (Sentry)

## next.config.js

- CommonJS, chaîné : next-intl/plugin → @sentry/nextjs
- `reactStrictMode: true`
- `images.formats: ["image/webp", "image/avif"]`
- `images.remotePatterns` : IGDB, Wikipedia, Steam, GOG, Epic, Nintendo,
  Supabase Storage, etc.

## Patterns communs

- `params` est une `Promise` (Next 15) : `const { locale } = await params;`
- `setRequestLocale(locale)` dans les layouts server pour le static rendering
- `generateStaticParams()` retourne les deux locales
- `dynamic()` import pour les composants lourds :
  `dynamic(() => import("..."), { ssr: false })`
- `<ErrorBoundary>` + `<ErrorFallback>` systématiques

## Règles

- ✅ Toute page dans `src/app/[locale]/` ou `src/app/[locale]/admin/`
- ✅ Utiliser `Link`, `useRouter` de `@/i18n/navigation` (pas `next/navigation`)
- ✅ Server components par défaut, `"use client"` uniquement si nécessaire
- ✅ `loading.tsx` pour chaque section de pages
- ✅ `error.tsx` pour les pages critiques
- ❌ Ne jamais utiliser `next/link` directement (pas de préfixe locale)
- ❌ Ne jamais hardcoder `/fr/` ou `/en/` dans les URLs
