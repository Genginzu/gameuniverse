# ISR Hybrid — Pages publiques

## Description

Implémentation de l'ISR (Incremental Static Regeneration) hybrid sur toutes les pages publiques de Game Universe. Les données sont pré-rendues côté serveur avec un cache ISR, puis passées en `fallbackData` à SWR côté client pour un rendu immédiat sans skeleton.

## Pattern utilisé

```
Page Server Component (async)
  → fetch données avec next: { revalidate }
  → passe initialData au Client Component
    → SWR utilise fallbackData pour rendu immédiat
    → SWR revalide en arrière-plan (stale-while-revalidate)
    → Filtres/pagination déclenchent de nouveaux fetch client
```

## Module listing (`src/lib/listing/`)

Les listings paginés/filtrés partagent un module unique qui garantit que la
clé SWR côté client et l'URL ISR côté serveur sont identiques :

- `resources/*.ts` — une définition par ressource : endpoint, filtres par
  défaut, taille de page, `fields`, mapping filtres → query params,
  `revalidate`, options SWR spécifiques (`refreshInterval`, `dedupingInterval`).
- `url.ts` — `buildListingUrl` / `buildDefaultListingUrl` (builder unique) et
  `resolveListingFallback` (le `fallbackData` n'est servi que si l'URL courante
  est égale à l'URL par défaut).
- `state.ts` — reducer : tout changement de filtre remet la page à 1 dans le
  setter (pas de `useEffect`).
- `server.ts` — `fetchListingDefault(resource, context)` pour les pages ISR,
  `fetchInternalApi(path, revalidate)` pour les pages de détail ; loggent et
  renvoient `undefined` en cas d'échec.
- `src/hooks/useListingQuery.ts` — hook client (SWR + fetcher partagé
  `@/lib/swr/fetcher`, `keepPreviousData`, scroll en haut au changement de page).

Ajouter un listing : créer la ressource, l'utiliser dans la page
(`fetchListingDefault`) et dans le composant client (`useListingQuery`).

## Pages concernées

| Page | Route | Revalidate | Données pré-rendues |
|------|-------|-----------|---------------------|
| Accueil | `/[locale]` | 5 min | Jeux récents (8) |
| Jeux | `/[locale]/games` | 5 min | Liste page 1 (20 jeux, avec descriptions) |
| Personnages | `/[locale]/characters` | 5 min | Liste page 1 (20 personnages) |
| Trending | `/[locale]/trending` | 5 min | 4 sections (12 jeux chacune) |
| Upcoming | `/[locale]/upcoming` | 5 min | Jeux à venir page 1 (24) |
| Posts par tag | `/[locale]/posts/tags/[tag]` | 1 min | Page 1 des posts du tag |
| Esport Teams | `/[locale]/esport/teams` | 1h | Liste complète |
| Esport Players | `/[locale]/esport/players` | 1h | Liste complète |
| Esport Tournaments | `/[locale]/esport/tournaments` | 1h | Tournois |
| Esport Results | `/[locale]/esport/results` | 1h | Résultats récents |
| Esport Live | `/[locale]/esport/live` | 1h | Streams en cours |
| Esport Team Detail | `/[locale]/esport/teams/[id]` | 1h | Détail équipe + roster |
| Esport Player Detail | `/[locale]/esport/players/[id]` | 1h | Détail joueur |

## Pages déjà en ISR (non modifiées)

- `/[locale]/games/[slug]` — Server Component avec `revalidate: 60` via `GameService`
- `/[locale]/characters/[slug]` — Server Component avec `revalidate: 600` via `CharacterService`

## Bénéfices

- **SEO** : Le HTML contient les données pré-rendues, indexables par les crawlers
- **Performance** : FCP/LCP améliorés — pas de waterfall JS → fetch → render
- **UX** : Pas de skeleton au premier chargement sur les pages ISR
- **Interactivité** : Filtres, pagination, recherche restent côté client via SWR

## Prérequis

- Hébergement Vercel (ISR natif supporté)
- Variable `NEXT_PUBLIC_BASE_URL` configurée en production

## Vérification

En production, vérifier les headers de réponse :
- `x-nextjs-cache: HIT` → page servie depuis le cache ISR
- `x-nextjs-cache: STALE` → page servie depuis le cache, revalidation en cours
- `x-nextjs-cache: MISS` → page générée à la demande

Pour vérifier le contenu pré-rendu :
```bash
curl -s https://gameuniverse.gg/fr/games | grep -o '<h3[^>]*>[^<]*</h3>' | head -5
```
