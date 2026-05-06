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

## Pages concernées

| Page | Route | Revalidate | Données pré-rendues |
|------|-------|-----------|---------------------|
| Accueil | `/[locale]` | 5 min | Jeux récents (8) |
| Jeux | `/[locale]/games` | 5 min | Liste page 1 (20 jeux) |
| Personnages | `/[locale]/characters` | 5 min* | Liste page 1 (20 personnages) |
| Trending | `/[locale]/trending` | 5 min | 4 sections (12 jeux chacune) |
| Upcoming | `/[locale]/upcoming` | 5 min | Jeux à venir page 1 (24) |
| Esport Teams | `/[locale]/esport/teams` | 1h | Liste complète |
| Esport Players | `/[locale]/esport/players` | 1h | Liste complète |
| Esport Calendar | `/[locale]/esport/calendar` | 1h | Tournois |
| Esport Results | `/[locale]/esport/results` | 1h | Résultats récents |
| Esport Live | `/[locale]/esport/live` | 1h | Streams en cours |
| Esport Team Detail | `/[locale]/esport/teams/[id]` | 1h | Détail équipe + roster |
| Esport Player Detail | `/[locale]/esport/players/[id]` | 1h | Détail joueur |

*La page characters utilise `createServerClient` (cookies) donc est rendue dynamiquement, mais les données initiales sont quand même passées au composant client.

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
