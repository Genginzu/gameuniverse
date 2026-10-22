---
inclusion: always
---

# Skill : Architecture — GameUniverse

## Stack technique

| Techno        | Version/Détail                        |
| ------------- | ------------------------------------- |
| Framework     | Next.js 16 (App Router, React 19)     |
| Runtime       | Bun                                   |
| BDD           | Supabase (PostgreSQL)                 |
| Styling       | Tailwind CSS 4 + glassmorphism        |
| i18n          | next-intl (FR/EN)                     |
| Data fetching | SWR (client), API routes (server)     |
| Forms         | react-hook-form + Zod                 |
| Tests         | Vitest + Testing Library + fast-check |
| Icônes        | @iconify/react                        |
| Rich text     | TipTap                                |
| Charts        | Recharts                              |
| Monitoring    | Sentry                                |
| Hébergement   | Vercel                                |

## Structure src/

```
src/
├── app/              # Pages et API routes
│   ├── api/          # API routes (hors [locale])
│   └── [locale]/     # Pages publiques + admin
├── components/
│   ├── admin/        # Composants admin (par entité)
│   ├── games/        # Composants page jeux
│   ├── players/      # Composants page joueurs
│   ├── characters/   # Composants page personnages
│   ├── shared/       # 24 composants réutilisables
│   └── ui/           # 27 primitives UI
├── hooks/            # 72 hooks custom
├── lib/
│   ├── services/     # 53 services métier
│   ├── utils/        # 27 utilitaires
│   ├── validations/  # Schémas Zod
│   └── swr/          # Config SWR + fetcher
├── types/            # 52 fichiers de types
├── messages/         # fr.json, en.json
└── i18n/             # Config next-intl
```

## Hooks disponibles (72)

### Admin (16)

useAdminAchievements, useAdminAuth, useAdminCharacters, useAdminComments,
useAdminCompanies, useAdminDescriptors, useAdminGames, useAdminGenders,
useAdminGenres, useAdminLanguages, useAdminPlatforms, useAdminRatings,
useAdminRatingSystems, useAdminReviews, useAdminRoles, useAdminSpecies,
useAdminTranslations

### Formulaires (11)

useCharacterForm, useCompanyForm, useDescriptorForm, useGameForm, useGenderForm,
useGenreForm, useLanguageForm, useRatingForm, useRatingSystemForm, useRoleForm,
useSpeciesForm

### Jeux (6)

useGenres, usePlatforms, useGameLibraryStatus, useGameOverrides,
useGameSync, useBackgroundSync

### Listings (3)

useListingQuery (module `src/lib/listing/`), useEsportGameOptions,
useDebouncedCallback

### Personnages (4)

useCharacterFavorite, useCharacterFavorites, useCharacterFilters,
useCharacterSync

### Joueurs (7)

usePlayerActivity, usePlayerAchievementManager,
usePlayerPlaytime, usePlayerPosts, usePlayerReviews, usePostImageUpload,
useProfile

### Social (4)

useFriendRelationship, useFriends, usePendingRequestCount, useDiscussions

### Bibliothèque (6)

useCollectionDetail, useCollectionMutations, useCollections,
useEntityLibraryToggle, useLibraryGames, useUserLibrary

### Reviews & Comments (4)

useComments, useReviews, useReviewVote, useMentionAutocomplete

### UI & Utilitaires

useAuth, useCropEditor, useDebouncedValue, useImageUpload, useInView,
usePriceHistory, useGlobalSearch, useWebhookEvents, useWebhookRegistrations, useAchievements,
useRecommendations, usePersonalRecommendations

## Composants UI (`src/components/ui/`)

Button, Input, Textarea, Select, Checkbox, Label, Badge, Card, Dialog, Form,
Skeleton, Spinner, Toast, LazyImage, LoadingButton, LoadingSpinner,
NavigationProgress, IconPicker, GameUniverseLogo

## Composants partagés (`src/components/shared/`)

SearchBar, Pagination, FilterPanel, FilterButton, FilterChip, FilterSection,
EntityCard, EntitySkeleton, GridSkeleton, CropEditor, ImageUploader,
ErrorBoundary, ErrorFallback, LanguageSwitcher, Footer

## Services clés (`src/lib/services/`)

| Domaine         | Services                                                    |
| --------------- | ----------------------------------------------------------- |
| IGDB            | igdbService, igdb-sync, igdb-sync-fields, gameImportService |
| Jeux            | gameService, gameFilterResolvers, translationService        |
| Personnages     | characterService, characterFavoriteService                  |
| Joueurs         | playerService, playerStatsService, playerPostsService       |
| Social          | friendService, discussionService                            |
| Collections     | collectionService, collectionQueries, collectionMutations   |
| Reviews         | reviewService, reviewVoteService, commentService            |
| Recherche       | globalSearchService, hybridSearchService                    |
| Succès          | achievementEngine, achievementService                       |
| Recommandations | recommendationService (+ sous-modules scorers)              |

## Commandes

```bash
bun run dev          # Dev server
bun run build        # Build production
bun run lint         # ESLint
bun run test:all     # Tous les tests Vitest
bun run type-check   # TypeScript check
bun run format       # Prettier
bun run supabase:types  # Régénérer les types DB
```
