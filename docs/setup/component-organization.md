# Organisation des Composants — GameUniverse

## Structure

```
src/components/
├── admin/                     # Composants d'administration
│   ├── shared/                # Composants admin génériques
│   │   ├── AdminDataTable.tsx     # Table générique (colonnes, tri, recherche, pagination)
│   │   ├── AdminDeleteDialog.tsx  # Dialog de suppression générique
│   │   ├── AdminSlugForm.tsx      # Formulaire slug + traductions générique
│   │   ├── AdminTranslationFields.tsx  # Champs de traduction par langue
│   │   ├── AdminTableSkeleton.tsx # Skeleton de table
│   │   ├── AdminSearchBar.tsx     # Barre de recherche admin
│   │   └── AdminTablePagination.tsx # Pagination admin
│   ├── games/                 # Composants admin jeux (formulaire, onglets)
│   ├── characters/            # Composants admin personnages
│   ├── age-classifications/   # Composants admin classifications d'âge
│   ├── achievements/          # Composants admin succès
│   ├── global-sync/           # Onglets de synchronisation IGDB
│   │   └── SyncTabLayout.tsx  # Layout générique pour les onglets de sync
│   ├── webhooks/              # Gestion des webhooks
│   ├── translations/          # Gestion des traductions du site
│   ├── bulk-import/           # Import en masse
│   └── [entité]/              # genres, genders, species, roles, languages,
│                              # companies, comments, reviews, platforms
│
├── shared/                    # Composants réutilisables entre pages
│   ├── index.ts               # Barrel export (34 composants)
│   ├── SearchBar.tsx          # Barre de recherche (simple + hybride IGDB)
│   ├── Pagination.tsx         # Pagination générique
│   ├── FilterPanel.tsx        # Panel de filtres multi-sections
│   ├── FilterButton.tsx       # Bouton toggle filtres
│   ├── EmptyState.tsx         # État vide générique (Iconify + gradient)
│   ├── EntityCard.tsx         # Carte générique (jeux, joueurs, personnages)
│   ├── entityCardPresets.tsx  # Presets de configuration EntityCard
│   ├── EntitySkeleton.tsx     # Skeleton configurable par entité
│   ├── GridSkeleton.tsx       # Grille de skeletons
│   ├── PageBanner.tsx         # Bannière de page contextuelle
│   ├── IconPicker.tsx         # Sélecteur d'icônes Iconify
│   ├── NavigationProgress.tsx # Barre de progression navigation
│   ├── ImageUploader.tsx      # Upload d'image avec drag & drop
│   ├── CropEditor.tsx         # Éditeur de recadrage d'image
│   ├── GlobalSearch*.tsx      # Composants de recherche globale
│   ├── Notification*.tsx      # Composants de notifications
│   ├── ErrorBoundary.tsx      # Error Boundary React
│   └── ErrorFallback.tsx      # Fallback d'erreur déclaratif
│
├── ui/                        # Primitives UI (shadcn/ui)
│   ├── button.tsx, input.tsx, textarea.tsx, select.tsx
│   ├── dialog.tsx, card.tsx, badge.tsx, form.tsx
│   ├── loading-spinner.tsx, loading-state.tsx, loading-button.tsx
│   ├── lazy-image.tsx, carousel.tsx, toast.tsx
│   └── ...
│
├── games/                     # Composants page jeux publique
│   ├── AllGamesContent.tsx    # Page liste des jeux
│   ├── GameCard.tsx           # Carte de jeu (recommandations/similaires)
│   ├── details/               # Sous-composants page détail jeu
│   └── reviews/               # Composants reviews de jeux
│
├── players/                   # Composants page joueurs
│   ├── AllPlayersContent.tsx  # Page liste des joueurs (SWR)
│   ├── PlayerCard.tsx         # Carte joueur
│   └── [sous-dossiers]/       # activity, posts, stats, collections, etc.
│
├── characters/                # Composants page personnages
│   ├── AllCharactersContent.tsx
│   └── details/               # Sous-composants page détail personnage
│
├── auth/                      # Composants d'authentification
├── collections/               # Composants collections
├── home/                      # Composants page d'accueil
└── providers/                 # Providers React (Error, SWR, Theme)
```

## Composants génériques admin

### AdminDeleteDialog
Dialog de confirmation de suppression, utilisé par toutes les pages admin.
Props : `translationNamespace`, `warningParams`, `usageCount`, `blockOnUsage`.

### AdminDataTable
Table générique avec colonnes configurables, tri, recherche, pagination.
Props : `columns: AdminColumnDef<T>[]`, `translationNamespace`, `totalCountKey`, `emptyKey`.

### AdminSlugForm + AdminTranslationFields
Formulaire slug + traductions par langue. Utilisé par genres, genders, species, roles.
Props : `translationFields` (config des champs par langue).

### SyncTabLayout
Layout générique pour les onglets de synchronisation IGDB.
Props : `syncState`, `onStart/onStop`, `renderExtraStats`.

## Composants partagés

### EmptyState
État vide générique avec icône Iconify, gradient cyan→violet, variantes glass/card.

### SearchBar
Barre de recherche avec mode simple (debounce) et mode hybride (IGDB).

### Pagination
Pagination avec boutons, sélecteur mobile, et support i18n.

### FilterPanel
Panel de filtres multi-sections avec chips actifs.

## Conventions

- Chaque fichier ≤ 150 lignes (composants), ≤ 300 lignes (fichiers)
- Icônes via `@iconify/react` uniquement
- Gradient : `from-cyan-500 to-violet-500` (jamais de gradient custom)
- Glassmorphism : `bg-white/40 backdrop-blur-xl` (pas de fonds opaques)
- Tests dans `test/unit/components/` (pas dans `src/`)
