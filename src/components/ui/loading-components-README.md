# Loading Components Documentation

Ce document décrit les composants d'états de chargement ajoutés à l'application
Game Universe.

## Composants de Skeleton

### GameCardSkeleton

Skeleton pour les cartes de jeu individuelles.

```tsx
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";

<GameCardSkeleton />;
```

### GameGridSkeleton

Skeleton pour la grille de jeux avec un nombre configurable de cartes.

```tsx
import { GameGridSkeleton } from "@/components/games/GameGridSkeleton";

<GameGridSkeleton count={20} />;
```

### SearchSkeleton

Skeleton complet pour la page de recherche/tous les jeux.

```tsx
import { SearchSkeleton } from "@/components/games/SearchSkeleton";

<SearchSkeleton />;
```

### GameDetailsSkeleton

Skeleton pour la page de détails d'un jeu.

```tsx
import { GameDetailsSkeleton } from "@/components/games/GameDetailsSkeleton";

<GameDetailsSkeleton />;
```

### DashboardSkeleton

Skeleton pour le tableau de bord utilisateur.

```tsx
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

<DashboardSkeleton />;
```

### LibrarySkeleton

Skeleton pour la bibliothèque utilisateur.

```tsx
import { LibrarySkeleton } from "@/components/library/LibrarySkeleton";

<LibrarySkeleton />;
```

## Composants Utilitaires

### LoadingState

Composant générique pour différents types d'états de chargement.

```tsx
import { LoadingState } from "@/components/ui/loading-state";

<LoadingState type="spinner" message="Chargement..." />
<LoadingState type="skeleton" />
<LoadingState type="pulse" size="lg" />
```

### LazyImage

Composant d'image avec chargement lazy et skeleton intégré.

```tsx
import { LazyImage } from "@/components/ui/lazy-image";

<LazyImage
  src="/path/to/image.jpg"
  alt="Description"
  fill
  showSkeleton={true}
  className="rounded-lg"
/>;
```

### LoadingButton

Bouton avec indicateur de chargement intégré.

```tsx
import { LoadingButton } from "@/components/ui/loading-button";

<LoadingButton loading={isLoading} loadingText="Chargement...">
  Sauvegarder
</LoadingButton>;
```

### PageLoading

Overlay de chargement pour toute la page.

```tsx
import { PageLoading } from "@/components/ui/page-loading";

<PageLoading type="spinner" message="Chargement de la page..." />
<PageLoading type="skeleton" />
<PageLoading type="minimal" />
```

## Composants Spécialisés

### FormSkeleton

Skeleton pour les formulaires.

```tsx
import { FormSkeleton } from "@/components/ui/form-skeleton";

<FormSkeleton fields={4} showHeader={true} showButtons={true} />;
```

### ListSkeleton

Skeleton pour les listes d'éléments.

```tsx
import { ListSkeleton } from "@/components/ui/list-skeleton";

<ListSkeleton items={5} showAvatar={true} showSecondaryText={true} />;
```

### FiltersSkeleton

Skeleton pour les filtres de recherche.

```tsx
import { FiltersSkeleton } from "@/components/games/FiltersSkeleton";

<FiltersSkeleton />;
```

### MediaGallerySkeleton

Skeleton pour les galeries de médias.

```tsx
import { MediaGallerySkeleton } from "@/components/games/MediaGallerySkeleton";

<MediaGallerySkeleton />;
```

## Hook Utilitaire

### useImageLoading

Hook pour gérer le chargement des images.

```tsx
import { useImageLoading } from "@/hooks/useImageLoading";

const { isLoading, hasError, imageSrc } = useImageLoading({
  src: "/path/to/image.jpg",
  fallbackSrc: "/fallback.jpg",
});
```

## Bonnes Pratiques

1. **Utilisez les skeletons spécialisés** pour chaque type de contenu
   (GameCardSkeleton pour les cartes, etc.)
2. **Maintenez la cohérence** en utilisant les mêmes dimensions que le contenu
   final
3. **Gérez les états de transition** avec des animations fluides
4. **Optimisez les performances** en utilisant LazyImage pour les images
5. **Fournissez des messages de chargement** appropriés pour l'expérience
   utilisateur

## Configuration

Les composants utilisent les classes Tailwind CSS et sont compatibles avec le
thème shadcn/ui de l'application.

Tous les composants supportent les props `className` pour la personnalisation
supplémentaire.
