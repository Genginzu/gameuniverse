---
inclusion: always
---

# Code Quality: Robuste, Maintenable, Lisible

## Règle principale

Tout code produit doit être **robuste**, **maintenable** et **lisible par un
humain**. La clarté prime sur la concision.

## Taille des fichiers

- Un fichier ne doit **jamais dépasser 300 lignes**. Au-delà de 200 lignes,
  envisager un découpage.
- Si un composant React dépasse 150 lignes, extraire les sous-composants, hooks
  ou utilitaires dans des fichiers séparés.
- Chaque fichier a **une seule responsabilité** claire.

## Organisation des fichiers

### Composants

Regrouper par page/feature, pas par type technique :

```
src/components/
├── admin/
│   ├── games/          # Composants liés à la page admin games
│   └── languages/      # Composants liés à la page admin languages
├── games/              # Composants liés à la page publique games
├── characters/         # Composants liés à la page characters
├── shared/             # Composants réutilisables entre pages
└── ui/                 # Primitives UI (Button, Input, etc.)
```

### Découpage d'un gros composant

Quand un composant formulaire ou page devient trop long, découper ainsi :

```
src/components/admin/games/
├── GameForm.tsx              # Composant principal (orchestration)
├── GameFormGeneralTab.tsx    # Onglet informations générales
├── GameFormImagesTab.tsx     # Onglet images
└── GameFormCompaniesTab.tsx  # Onglet entreprises
```

### Hooks

- Un hook custom par fichier dans `src/hooks/`.
- Si un hook dépasse 100 lignes, découper la logique en fonctions utilitaires.

### Types

Tous les fichiers de types/interfaces partagés doivent être dans `src/types/`,
organisés par domaine :

```
src/types/
├── admin.ts        # Types liés à l'administration
├── auth.ts         # Types liés à l'authentification
├── games.ts        # Types liés aux jeux
├── characters.ts   # Types liés aux personnages
├── players.ts      # Types liés aux joueurs
├── api.ts          # Types partagés pour les réponses/requêtes API
└── common.ts       # Types utilitaires génériques
```

- ❌ Ne pas éparpiller les types partagés dans `src/lib/`, `src/components/` ou
  à côté des composants.
- ✅ Un type/interface utilisé **uniquement par un seul composant** peut rester
  dans le fichier du composant lui-même.
- ✅ Dès qu'un type est utilisé par **plus d'un fichier**, le placer dans
  `src/types/`.
- ❌ Pas de fichier `types.ts` local dans les dossiers de composants.
- ✅ Dès qu'un type est utilisé par **2+ domaines différents**, le déplacer dans
  `src/types/`.

### Utilitaires et services

```
src/lib/
├── services/       # Logique métier (appels API, transformations)
├── utils/          # Fonctions utilitaires pures
└── validations/    # Schémas Zod
```

## Conventions de nommage

- Composants : `PascalCase.tsx`
- Hooks : `useCamelCase.ts`
- Utilitaires : `camelCase.ts`
- Types/interfaces : `PascalCase` dans un fichier `types.ts` si partagés

## Placement des nouvelles pages

Toute nouvelle page créée **doit** être placée dans l'un des deux layouts
existants :

- `src/app/[locale]/admin/` — pour les pages d'administration
- `src/app/[locale]/` — pour les pages publiques (utilisateur)

❌ Ne **jamais** créer de page en dehors de ces deux layouts. ⚠️ En cas de doute
sur le layout approprié, **demander à l'utilisateur** avant de créer la page.

## Fetching de données côté client : SWR

Le projet utilise **SWR** (`swr`) pour le fetching de données côté client.

- ✅ Utiliser `useSWR` en **priorité** pour tout besoin de fetching, cache,
  revalidation ou synchronisation de données côté client.
- ✅ SWR couvre la majorité des cas : listes, détails, polling, optimistic
  updates, pagination, etc.
- ⚠️ Si SWR ne répond pas au besoin (ex : upload de fichier, mutation complexe
  sans revalidation, appel ponctuel sans cache), utiliser une approche plus
  adaptée (`fetch` direct, server action, etc.).
- ❌ Ne **jamais** réimplémenter manuellement un mécanisme de cache ou de
  revalidation que SWR fournit déjà.

## ISR (Incremental Static Regeneration) : obligatoire sur les pages publiques

Toute page publique affichant des données **doit** utiliser le pattern ISR
hybrid pour améliorer le SEO et la performance perçue (FCP/LCP).

### Pattern ISR hybrid

```
Page Server Component (async)
  → fetch données via API interne avec next: { revalidate }
  → passe initialData au Client Component
    → SWR utilise fallbackData pour rendu immédiat
    → Filtres/pagination restent côté client via SWR
```

### Durées de revalidation

| Type de données          | Revalidate | Exemple                          |
| ------------------------ | ---------- | -------------------------------- |
| Données très dynamiques  | 60s        | Détail d'un jeu, personnage     |
| Listings / trending      | 300s (5m)  | Liste jeux, trending, upcoming   |
| Données peu volatiles    | 3600s (1h) | Esport (rafraîchi 1x/jour)      |

### Règles

- ✅ Toute nouvelle page publique **doit** avoir `export const revalidate = N`
  avec une durée adaptée à la volatilité des données.
- ✅ Fetch les données initiales côté serveur via un appel API interne
  (`fetch(baseUrl + '/api/...')` avec `next: { revalidate }`).
- ✅ Passer les données en prop `initialData` / `initialGames` /
  `initialCharacters` au composant client.
- ✅ Le composant client utilise `fallbackData` de SWR pour un rendu immédiat
  (pas de skeleton au premier chargement).
- ✅ Le `fallbackData` ne s'applique que sur la vue par défaut (page 1, pas de
  filtres). Dès que l'utilisateur filtre/pagine, SWR fetch normalement.
- ❌ Ne **jamais** utiliser `createServerClient` (cookies) dans une page ISR —
  cela force le rendu dynamique. Utiliser un appel API interne à la place.
- ❌ Ne **jamais** utiliser `export const dynamic = "force-dynamic"` sur une
  page publique sauf cas exceptionnel justifié (données temps réel, auth
  requise).
- ❌ Ne **jamais** laisser une page publique rendre un shell vide côté serveur
  avec 100% du fetch côté client — c'est mauvais pour le SEO et la performance.

### Exemple minimal

```tsx
// page.tsx (Server Component)
export const revalidate = 300;

export default async function MyPage({ params }) {
  const { locale } = await params;
  let initialData;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/my-data?locale=${locale}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) initialData = await res.json();
  } catch (error) {
    logger.error("Failed to fetch data server-side", { error });
  }

  return <MyContent initialData={initialData} />;
}

// MyContent.tsx (Client Component)
export function MyContent({ initialData }) {
  const { data } = useSWR(url, fetcher, { fallbackData: initialData });
  // ...
}
```



## Bonnes pratiques

- ❌ Pas de logique métier dans les composants de page (`page.tsx`). Déléguer
  aux composants et hooks.
- ❌ Pas de fonctions utilitaires inline de plus de 10 lignes. Les extraire.
- ❌ Pas de duplication. Si du code est copié-collé, l'extraire dans un module
  partagé.
- ✅ Chaque fonction fait **une seule chose**.
- ✅ Nommer les variables et fonctions de manière explicite (pas de `data`,
  `tmp`, `x`).
- ✅ Commenter le **pourquoi**, pas le **quoi**.
