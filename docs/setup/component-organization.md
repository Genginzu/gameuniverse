# Organisation des Composants - Game Universe

## Structure Finale Après Nettoyage

```
src/components/
├── shared/                    # Composants partagés (layouts, auth)
│   ├── AuthenticatedPage.tsx  # Wrapper d'authentification pour toutes les pages connectées
│   └── DashboardLayout.tsx    # Layout unifié avec sidebar et navigation
│
├── dashboard/                 # Composants spécifiques au tableau de bord
│   └── DashboardContent.tsx   # Contenu principal du dashboard
│
├── games/                     # Composants pour la page "Tous les jeux" (/games)
│   ├── AllGamesContent.tsx    # Contenu principal avec recherche et filtres
│   ├── GameCard.tsx           # Carte de jeu (pointe vers /games/[slug])
│   ├── GameSearchBar.tsx      # Barre de recherche spécialisée
│   ├── GameFilters.tsx        # Filtres par genre, plateforme, éditeur
│   └── GamePagination.tsx     # Pagination spécialisée
│
├── library/                   # Composants pour la bibliothèque utilisateur (/library)
│   └── UserLibraryContent.tsx # Contenu de la bibliothèque personnelle
│
├── ui/                        # Composants UI de base (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
│
├── providers/                 # Providers React
│   └── IntlProvider.tsx
│
├── __tests__/                 # Tests des composants
│   ├── AuthForm.test.tsx
│   ├── GameLibrary.property.test.ts
│   └── Navigation.test.tsx
│
└── [Composants racine]        # Composants généraux
    ├── Dashboard.tsx          # Dashboard principal (layout complet)
    ├── DashboardWithAuth.tsx  # Dashboard avec authentification
    ├── LandingPage.tsx        # Page d'accueil non connectée
    ├── Navigation.tsx         # Navigation générale
    ├── AuthForm.tsx           # Formulaires d'authentification
    └── ...
```

## Doublons Supprimés

### ✅ Composants supprimés (doublons)

- `src/components/GameCard.tsx` → Remplacé par
  `src/components/games/GameCard.tsx`
- `src/components/Pagination.tsx` → Remplacé par
  `src/components/games/GamePagination.tsx`
- `src/components/SearchBar.tsx` → Remplacé par
  `src/components/games/GameSearchBar.tsx`
- `src/components/AuthenticatedPage.tsx` → Remplacé par
  `src/components/shared/AuthenticatedPage.tsx`
- `src/components/DashboardLayout.tsx` → Remplacé par
  `src/components/shared/DashboardLayout.tsx`
- `src/components/GameLibrary.tsx` → Remplacé par
  `src/components/games/AllGamesContent.tsx`
- `src/components/GameLibraryPage.tsx` → Remplacé par
  `src/components/games/AllGamesContent.tsx`

### ✅ Tests obsolètes supprimés

- `src/components/__tests__/GameLibrary.test.tsx` → Utilisait les anciens
  composants supprimés

## Architecture des Pages

### Pages utilisant le layout unifié (DashboardLayout)

- `/dashboard` → `Dashboard.tsx` (layout complet intégré)
- `/games` → `AuthenticatedPage` + `AllGamesContent`
- `/library` → `AuthenticatedPage` + `UserLibraryContent`
- `/profile` → `AuthenticatedPage` + contenu profil
- `/settings` → `AuthenticatedPage` + contenu paramètres

### Distinction claire

- **"Jeux" (`/games`)** : Catalogue complet avec `AllGamesContent`
- **"Ma bibliothèque" (`/library`)** : Collection personnelle avec
  `UserLibraryContent`

## Avantages de cette organisation

1. **Pas de doublons** : Chaque composant a une responsabilité unique
2. **Organisation claire** : Composants groupés par fonctionnalité
3. **Réutilisabilité** : Composants spécialisés mais réutilisables
4. **Maintenabilité** : Structure logique et prévisible
5. **Scalabilité** : Facile d'ajouter de nouveaux composants dans les bons
   dossiers

## Navigation

- **Header** : Navigation principale entre sections (Jeux, Personnages, etc.)
- **Sidebar** : Navigation interne (Dashboard, Ma bibliothèque, Profil,
  Paramètres)
- **Layout unifié** : Toutes les pages connectées utilisent `DashboardLayout`
