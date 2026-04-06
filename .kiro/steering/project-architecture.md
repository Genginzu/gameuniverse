---
inclusion: always
---

# Skill : Architecture — GameUniverse

## Stack technique

| Techno | Version/Détail |
|--------|---------------|
| Framework | Next.js 16 (App Router, React 19) |
| Runtime | Bun |
| BDD | Supabase (PostgreSQL) |
| Styling | Tailwind CSS 4 + glassmorphism |
| i18n | next-intl (FR/EN) |
| Data fetching | SWR (client), API routes (server) |
| Forms | react-hook-form + Zod |
| Tests | Vitest + Testing Library + fast-check |
| Icônes | @iconify/react |
| Rich text | TipTap |
| Charts | Recharts |
| Monitoring | Sentry |
| Hébergement | Vercel |

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
useCharacterForm, useCompanyForm, useDescriptorForm, useGameForm,
useGenderForm, useGenreForm, useLanguageForm, useRatingForm,
useRatingSystemForm, useRoleForm, useSpeciesForm

### Jeux (6)
useGameDetails, useGameListing, useGameLibraryStatus, useGameOverrides,
useGameSync, useBackgroundSync

### Personnages (6)
useCharacterFavorite, useCharacterFavorites, useCharacterFilters,
useCharacterOverrides, useCharacters, useCharacterSync

### Joueurs (8)
usePlayerActivity, usePlayerAchievementManager, usePlayerCollections,
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
useAuth, useCropEditor, useDashboard, useDebouncedValue, useImageLoading,
useImageUpload, useInView, useLocaleManager, usePriceHistory, useGlobalSearch,
useSearchOverlay, useWebhookEvents, useWebhookRegistrations, useAchievements,
useRecommendations, usePersonalRecommendations

## Composants UI (`src/components/ui/`)

Button, Input, Textarea, Select, Checkbox, Label, Badge, Card, Dialog, Form,
Carousel, Skeleton, Spinner, Toast, LazyImage, LoadingButton, LoadingSpinner,
LoadingState, PageLoading, FormSkeleton, ListSkeleton, NavigationProgress,
IconPicker, GameUniverseLogo

## Composants partagés (`src/components/shared/`)

SearchBar, Pagination, FilterPanel, FilterButton, FilterChip, FilterSection,
EntityCard, EntitySkeleton, GridSkeleton, PageBanner, CropEditor, ImageUploader,
ErrorBoundary, ErrorFallback, LanguageSwitcher, GlobalSearchDropdown, Footer

## Services clés (`src/lib/services/`)

| Domaine | Services |
|---------|----------|
| IGDB | igdbService, igdb-sync, igdb-sync-fields, gameImportService |
| Jeux | gameService, gameFilterResolvers, translationService |
| Personnages | characterService, characterFavoriteService |
| Joueurs | playerService, playerStatsService, playerPostsService |
| Social | friendService, discussionService |
| Collections | collectionService, collectionQueries, collectionMutations |
| Reviews | reviewService, reviewVoteService, commentService |
| Recherche | globalSearchService, hybridSearchService |
| Succès | achievementEngine, achievementService |
| Recommandations | recommendationService (+ sous-modules scorers) |

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

## Conventions

- Composants : `PascalCase.tsx`, regroupés par feature
- Hooks : `useCamelCase.ts`, un par fichier dans `src/hooks/`
- Services : `camelCase.ts` dans `src/lib/services/`
- Types partagés : dans `src/types/`, par domaine
- Pages : dans `src/app/[locale]/` (public) ou `src/app/[locale]/admin/`
- Max 300 lignes par fichier, 150 pour les composants, 100 pour les hooks
