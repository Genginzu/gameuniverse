# Système de Gestion d'Erreurs Globale

Ce document décrit le système de gestion d'erreurs implémenté dans Game
Universe, qui fournit une approche cohérente et robuste pour gérer tous les
types d'erreurs dans l'application.

## Vue d'ensemble

Le système de gestion d'erreurs comprend :

- **Error Boundaries React** pour capturer les erreurs de composants
- **Composants Toast** pour les notifications d'erreur
- **Client API avec retry automatique** pour les erreurs réseau
- **Hooks personnalisés** pour faciliter l'utilisation
- **Classification automatique des erreurs** par type
- **Gestion centralisée** via un Provider global

## Architecture

```
ErrorProvider (Global)
├── ErrorBoundary (Capture les erreurs React)
├── Toaster (Notifications toast)
├── Error Classification (Types d'erreurs)
├── API Client (Retry automatique)
└── Hooks utilitaires
```

## Types d'erreurs

Le système classifie automatiquement les erreurs en plusieurs types :

```typescript
enum ErrorType {
  NETWORK = "NETWORK", // Erreurs de connexion réseau
  VALIDATION = "VALIDATION", // Erreurs de validation des données
  AUTHENTICATION = "AUTHENTICATION", // Erreurs d'authentification
  AUTHORIZATION = "AUTHORIZATION", // Erreurs d'autorisation
  NOT_FOUND = "NOT_FOUND", // Ressources non trouvées
  SERVER = "SERVER", // Erreurs serveur (5xx)
  UNKNOWN = "UNKNOWN", // Erreurs non classifiées
}
```

## Composants principaux

### 1. ErrorProvider

Provider global qui englobe toute l'application et fournit :

- Error Boundary pour capturer les erreurs React
- Toaster pour les notifications
- Contexte d'erreur pour les hooks

```tsx
// Déjà intégré dans src/app/[locale]/layout.tsx
<ErrorProvider>
  <NextIntlClientProvider locale={locale} messages={messages}>
    {children}
  </NextIntlClientProvider>
</ErrorProvider>
```

### 2. ErrorBoundary

Composant React qui capture les erreurs JavaScript et affiche une interface de
récupération :

```tsx
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

<ErrorBoundary fallback={<CustomErrorFallback />}>
  <MyComponent />
</ErrorBoundary>;
```

### 3. Client API avec retry

Client HTTP avec gestion d'erreurs et retry automatique :

```typescript
import { useApiClient } from "@/lib/api-client";

const apiClient = useApiClient();

// Appel avec retry automatique
const data = await apiClient.get("/api/games", {
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
  },
});
```

## Hooks utilitaires

### useAsyncError

Pour gérer les erreurs dans les opérations asynchrones :

```typescript
import { useAsyncError } from "@/components/providers/ErrorProvider";

const { executeAsync } = useAsyncError();

const result = await executeAsync(async () => {
  return await apiClient.get("/api/data");
}, "fetchData");
```

### useErrorBoundary

Pour déclencher manuellement l'Error Boundary :

```typescript
import { useErrorBoundary } from "@/hooks/use-error-boundary";

const { showBoundary } = useErrorBoundary();

// Déclencher l'Error Boundary pour une erreur critique
showBoundary(new Error("Erreur critique"));
```

### useFormErrorHandler

Pour gérer les erreurs de formulaire :

```typescript
import { useFormErrorHandler } from "@/hooks/use-error-boundary";

const { handleFormError } = useFormErrorHandler();

// Gérer une erreur de validation
handleFormError(validationError, "email");
```

## Utilisation pratique

### 1. Erreurs réseau avec retry

```typescript
// Le client API gère automatiquement les erreurs réseau
const fetchGames = async () => {
  try {
    const data = await apiClient.get("/api/games");
    return data;
  } catch (error) {
    // L'erreur est automatiquement classifiée et un toast est affiché
    console.error("Erreur lors du chargement des jeux:", error);
  }
};
```

### 2. Erreurs de composants

```typescript
// Utiliser executeAsync pour les opérations qui peuvent échouer
const { executeAsync } = useAsyncError();

const loadData = async () => {
  const result = await executeAsync(async () => {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("Erreur de chargement");
    return response.json();
  }, "loadData");

  if (result) {
    setData(result);
  }
  // Si erreur, un toast est automatiquement affiché
};
```

### 3. Erreurs critiques

```typescript
// Pour les erreurs qui nécessitent l'Error Boundary
const { showBoundary } = useErrorBoundary();

const handleCriticalError = (error: Error) => {
  // Déclenche l'Error Boundary avec interface de récupération
  showBoundary(error);
};
```

## Configuration du retry

Le système de retry est configurable par appel :

```typescript
const data = await apiClient.get("/api/endpoint", {
  retryConfig: {
    maxAttempts: 5, // Nombre max de tentatives
    baseDelay: 2000, // Délai de base (ms)
    maxDelay: 10000, // Délai maximum (ms)
    backoffMultiplier: 2, // Multiplicateur pour exponential backoff
    retryableErrors: [ErrorType.NETWORK, ErrorType.SERVER],
  },
});
```

## Messages d'erreur localisés

Le système supporte la localisation des messages d'erreur :

```typescript
import { getErrorMessage, ErrorType } from "@/lib/error-handling";

const message = getErrorMessage(ErrorType.NETWORK, "fr");
// "Erreur de connexion réseau. Vérifiez votre connexion internet."
```

## Monitoring et reporting

Le système inclut des hooks pour intégrer des services de monitoring :

```typescript
// Dans error-handling.ts
export function reportError(error: AppError, context?: string) {
  // Intégration avec Sentry, LogRocket, etc.
  console.error("Reporting error:", {
    message: error.message,
    type: error.type,
    context,
    stack: error.stack,
  });
}
```

## Bonnes pratiques

### 1. Utiliser le client API pour tous les appels HTTP

```typescript
// ✅ Bon
const data = await apiClient.get("/api/games");

// ❌ Éviter
const response = await fetch("/api/games");
```

### 2. Utiliser executeAsync pour les opérations async

```typescript
// ✅ Bon
const result = await executeAsync(() => loadData(), "loadData");

// ❌ Éviter les try/catch manuels partout
try {
  const result = await loadData();
} catch (error) {
  // Gestion manuelle...
}
```

### 3. Laisser le système gérer les erreurs courantes

```typescript
// ✅ Le système gère automatiquement
await apiClient.get("/api/data"); // Erreurs réseau, 5xx, etc.

// ✅ Gérer seulement les cas spéciaux
if (data.status === "empty") {
  toast({ title: "Aucune donnée disponible" });
}
```

### 4. Utiliser Error Boundaries pour les erreurs critiques

```typescript
// ✅ Pour les erreurs qui cassent l'interface
<ErrorBoundary fallback={<PageErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>
```

## Tests

Le système inclut un composant de démonstration pour tester tous les types
d'erreurs :

```typescript
import { ErrorDemo } from "@/components/shared/ErrorDemo";

// Uniquement visible en développement
<ErrorDemo />
```

## Exemple complet

Voici un exemple complet d'utilisation dans un composant :

```typescript
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/shared/ErrorFallback";

function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiClient = useApiClient();
  const { executeAsync } = useAsyncError();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const result = await executeAsync(async () => {
        return await apiClient.get("/api/my-data", {
          retryConfig: { maxAttempts: 3 }
        });
      }, "loadMyData");

      if (result) {
        setData(result);
      }
      setLoading(false);
    };

    loadData();
  }, [apiClient, executeAsync]);

  if (loading) return <div>Chargement...</div>;
  if (!data) return <div>Aucune donnée</div>;

  return <div>{/* Afficher les données */}</div>;
}

// Utilisation avec Error Boundary
export default function MyPage() {
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

Ce système fournit une gestion d'erreurs robuste et cohérente dans toute
l'application, avec un minimum de code boilerplate pour les développeurs.

## Error Boundaries au niveau des pages

Chaque page majeure est isolée par son propre `ErrorBoundary` pour éviter les
cascades d'erreurs :

| Page            | Composant enveloppé  | Options de récupération |
| --------------- | -------------------- | ----------------------- |
| `/dashboard`    | `DashboardContent`   | Reload                  |
| `/games`        | `AllGamesContent`    | Reload + home           |
| `/library`      | `UserLibraryContent` | Home                    |
| `/games/[slug]` | `GameDetailsContent` | Back vers `/games`      |

## Composant ErrorFallback

`src/components/shared/ErrorFallback.tsx` — UI d'erreur réutilisable, basée sur
le composant `Alert` de shadcn/ui. Props :

- `title`, `description` — texte personnalisable
- `showRefresh` — bouton reload
- `showBackButton`, `backUrl`, `backLabel` — navigation retour
- `showHomeButton` — retour à l'accueil
- `locale` — localisation FR/EN

```tsx
<ErrorBoundary
  fallback={
    <ErrorFallback
      title="Titre personnalisé"
      description="Description personnalisée"
      showRefresh
      showBackButton
      backUrl="/games"
      backLabel="Retour aux jeux"
      locale="fr"
    />
  }
>
  <YourComponent />
</ErrorBoundary>
```

## Loading states

Squelettes disponibles pour toutes les sections majeures :

| Composant              | Usage                      |
| ---------------------- | -------------------------- |
| `GameCardSkeleton`     | Carte de jeu individuelle  |
| `GameGridSkeleton`     | Grille de cartes           |
| `FiltersSkeleton`      | Section de filtres         |
| `SearchSkeleton`       | Page de recherche complète |
| `GameDetailsSkeleton`  | Page de détails d'un jeu   |
| `MediaGallerySkeleton` | Galerie de médias          |
| `LibrarySkeleton`      | Bibliothèque utilisateur   |
| `DashboardSkeleton`    | Dashboard                  |

**Patterns d'usage** :

- `AllGamesContent` — `SearchSkeleton` au chargement initial, `GameGridSkeleton`
  pendant pagination/filtrage, transitions fluides entre états
- `UserLibraryContent` — `LibrarySkeleton` pendant chargement, gestion gracieuse
  des états vides, affichage d'erreur avec retry
- `GameDetailsContent` — SSR avec loading states, lazy loading images avec
  placeholders, chargement progressif du contenu

## Bonnes pratiques (récapitulatif)

1. **Isolation** — chaque composant majeur a son propre `ErrorBoundary` pour
   empêcher les cascades.
2. **Messages user-friendly** — clairs, actionnables, traduits FR/EN, avec
   options de récupération (reload, back, home).
3. **Mode dev vs prod** — stack complet en dev, message court en prod, log
   console systématique.
4. **Test des boundaries** — composant `ErrorDemo` en dev (`/test-error`) pour
   déclencher boundary errors, async errors, form errors et network errors.

## Évolutions possibles

- Intégration monitoring (Sentry, LogRocket)
- Tracking analytics des erreurs
- Collecte de feedback utilisateur
- Gestion hors-ligne
- Suggestions de récupération selon le type d'erreur
