---
name: nextjs-app-router
description:
  Next.js App Router conventions for this project — locale routing under
  `src/app/[locale]/`, three page patterns (client, async server,
  server+client-fallback), i18n navigation helpers, middleware, layout nesting,
  and Next 15+ async `params`. Activate when creating pages, layouts, API
  routes, or anything touching `src/app/**`, `src/proxy.ts`, `src/i18n/**`, or
  `next.config.js`.
---

# Skill: Next.js App Router — GameUniverse

Full reference: `.kiro/skills/nextjs-app-router.md`. Read it when the user
creates a page/layout, works on routing, or touches `src/app/**`,
`src/proxy.ts`, `src/i18n/**`, or `next.config.js`.

## Key points (see reference for examples)

- **Two layouts only**: `src/app/[locale]/` (public, wrapped in
  `<DashboardLayout>`) or `src/app/[locale]/admin/` (wrapped via
  `<AdminLayout>`). Never create pages outside these.
- **API routes**: under `src/app/api/`, outside the `[locale]` segment.
- **Three page patterns**:
  - A: pure client page (`"use client"`) — simple pages, admin
  - B: async server page with `notFound()` + `generateMetadata()` — SEO detail
    pages
  - C: server with initial data + client fallback — SSR listings
- **Next 15+**: `params` is a Promise → `const { locale, slug } = await params;`
- **i18n navigation**: always
  `import { Link, useRouter, usePathname } from "@/i18n/navigation";` —
  **never** `next/link` / `next/navigation` directly (they bypass locale
  prefix).
- **Middleware** (`src/proxy.ts`): i18n only (`next-intl/middleware`), no auth
  middleware.
- **Locales**: `fr` (default), `en`. Config in `src/i18n/routing.ts` +
  `src/i18n.ts`.
- **Special files in use**: `loading.tsx` (admin only), `error.tsx` (several),
  `not-found.tsx` (admin, players/[id]), `global-error.tsx` (root, Sentry).
- **Layout stack**: root → `[locale]/layout.tsx` (async server,
  NextIntlClientProvider + SWRProvider + ErrorProvider) → `admin/layout.tsx`
  (`"use client"`).
- Use `setRequestLocale(locale)` in server layouts for static rendering;
  `generateStaticParams()` returns both locales.
- Heavy components: `dynamic(() => import("..."), { ssr: false })`.
