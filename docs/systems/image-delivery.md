# Images : loaders & quota Vercel

## Description

Toutes les images passent par `AppImage` (`src/components/ui/app-image.tsx`), un
remplaçant de `next/image`. Il choisit, selon l'hôte, la voie la moins coûteuse
qui livre quand même une image à la bonne taille. L'optimiseur Vercel (facturé
par transformation) n'est utilisé que pour les images sans variantes à la
source.

| Stratégie     | Hôtes                                                        | Traitement                                    |
| ------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `igdb`        | `images.igdb.com`                                            | Réécrit le preset `t_{size}` selon la largeur |
| `unsplash`    | `images.unsplash.com`                                        | Params CDN `w`, `q`, `auto=format`            |
| `passthrough` | YouTube, avatars Steam/Xbox/Discord, logos de stores         | `unoptimized` : servi tel quel (déjà petit)   |
| `optimize`    | Assets locaux, uploads Supabase, Wikimedia, PandaScore, etc. | Optimiseur Next/Vercel (WebP/AVIF)            |

Politique et loaders : `src/lib/utils/imageLoader.ts`.

## Presets IGDB

Le loader garde la famille du preset stocké (le cadrage ne change pas) et prend
le plus petit preset couvrant la largeur demandée (DPR déjà inclus par Next) :

- Jaquettes (`cover_*`) : `cover_small` → `cover_small_2x` → `cover_big` →
  `cover_big_2x` → `1080p`.
- Médias (`screenshot_*`, `720p`, `1080p`, `original`) : `screenshot_med` →
  `screenshot_big` → `720p` → `1080p`. Les presets `screenshot_*` recadrent en
  16:9 centré.
- Logos (`logo_med*`) et vignettes (`thumb*`, `micro*`).

Le paramètre `?w=` ajouté par le loader est ignoré par le CDN IGDB. Il évite
l'avertissement Next « loader does not implement width » quand le preset choisi
est déjà celui stocké, et vaut la largeur du preset (une seule URL par preset,
donc un seul cache). Une URL IGDB sans preset `t_*` est servie telle quelle.

## Utilisation

```tsx
import { AppImage } from "@/components/ui/app-image";

<AppImage
  src={game.coverUrl}
  alt={game.title}
  fill
  sizes="(min-width: 1024px) 20vw, 50vw"
/>;
```

- Toujours fournir `sizes` sur une image `fill` : sans lui, le srcset cible
  `100vw` et une jaquette serait téléchargée en `1080p`.
- `unoptimized` ou `loader` explicites sont respectés tels quels.
- Importer `next/image` directement est bloqué par ESLint
  (`no-restricted-imports`), sauf dans `app-image.tsx`.
- Un nouvel hôte va dans `remotePatterns` (`next.config.js`). S'il sert déjà des
  fichiers petits ou dimensionnés, l'ajouter aussi à `PASSTHROUGH_HOSTS`.

## Pourquoi un wrapper et pas `images.loaderFile`

Un `loaderFile` global désactive l'API d'optimisation sur Vercel
([vercel/next.js#53415](https://github.com/vercel/next.js/issues/53415)), ce qui
supprimerait la voie `optimize`. Une fonction `loader` ne peut pas non plus être
passée depuis un Server Component : le wrapper client la résout lui-même.
