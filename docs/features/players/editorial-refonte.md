# Page Profil joueur — refonte éditoriale (P2-01)

> Statut : Refondue dans la branche `design/editorial-refonte` (issue #221).
>
> **Plan global** :
> [`docs/design/editorial-refonte-plan.md`](../../design/editorial-refonte-plan.md)

## Description

La page `/players/[id]` adopte la direction éditoriale (variante POC player) :
hero asymétrique avatar + identité, bento de stats / highlights, navigation par
onglets éditoriale.

Palette d'accent : **GOLD** (évoque rang, prestige, trophées).

## Accès

- **URL** : `/[locale]/players/[id]` (FR + EN)
- **Source** : `src/app/[locale]/players/[id]/page.tsx`

## Architecture

```
EditorialShell (rail + sub-sidebar + mega-menu + search overlay)
└── DynamicAccent (palette: GOLD_PALETTE)
    └── PlayerDetailsContent
        ├── PlayerDetailHero      (avatar 5/12 + identité 7/12,
        │                          status + rank badge sur l'avatar,
        │                          kicker level, titre display avec
        │                          dernier mot accent, tagline italique,
        │                          friend/subscribe + social links,
        │                          mini stats games/heures/note)
        ├── PlayerDetailBento     (3 cols : Recent games XL +
        │                          Achievements + Note moyenne XL +
        │                          Latest post (wide) + Friends count)
        ├── LibraryComparisonSection (conditionnel : autre joueur connecté)
        └── editorial-player-detail-tabs-section
            ├── PlayerDetailEditorialTabs (kicker mono + accent underline)
            └── PlayerTabContent          (lazy tabs existants conservés)
```

## Composants éditoriaux (nouveaux)

Tous sous `src/components/players/sections/` :

| Fichier                         | Rôle                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `PlayerDetailHero.tsx`          | Hero asymétrique + identité + actions + stats                |
| `PlayerDetailBento.tsx`         | Grille bento : recent / achievements / note / post / friends |
| `PlayerDetailEditorialTabs.tsx` | Navigation par onglets style éditorial                       |

## Composants conservés

- `PlayerTabContent` + tabs lazy (`PlayerLazyTabs`)
- `FriendActionButton`, `SubscribeButton`, `PlayerProfileSocialLinks`
- `LibraryComparisonSection`
- `ActivityFeed`, `PlayerLibraryTab`, etc. (tabs internes)
- `useFriendRelationship`, `useAchievements`, `usePlayerPosts`
- `profile-tabs.ts` — type `ProfileTab` + helper `getDefaultTab`

## Composants supprimés (dead code)

- `PlayerProfileBanner.tsx` → remplacé par `PlayerDetailHero`
- `PlayerProfileTabs.tsx` → remplacé par `PlayerDetailEditorialTabs` (le type et
  `getDefaultTab` sont déplacés dans `profile-tabs.ts`)
- `ProgressRing.tsx` → composant ancien associé à `PlayerProfileBanner`

## Direction artistique

### Tokens utilisés

- `--editorial-bg`, `--editorial-bg-2` : surfaces sombres
- `--editorial-line` : bordures fines
- `--editorial-muted` : texte secondaire
- `--font-display` (Tomorrow) : nom du joueur, gros chiffres
- `--accent-50` … `--accent-900`, `--accent-rgb` : palette GOLD injectée par
  `<DynamicAccent>` (constante `GOLD_PALETTE` dans
  `src/lib/utils/accent-palette.ts`)

### Patterns

- ✅ Hero asymétrique 5/7 — avatar carré rounded-3xl avec inset glow accent
- ✅ Status badge (live) + rank badge accent sur l'avatar
- ✅ Titre display avec dernier mot en dégradé accent
- ✅ Tagline en display-light italique
- ✅ Mini stats (games / heures / note) avec divider top/bottom
- ✅ Bento 3 cols, pavé recent games en col-span-2 row-span-2
- ✅ SpotlightCard pour toutes les cards du bento (halo curseur)
- ✅ Tabs éditoriaux : kicker mono uppercase + soulignement accent
- ✅ Pas de glassmorphism, pas de `backdrop-blur`

### Styles

CSS dédié dans `src/app/styles/editorial/player-detail.css`. Importé par
`globals.css` après `editorial/game-detail.css`.

## Données affichées

| Section       | Source                                                    |
| ------------- | --------------------------------------------------------- |
| Hero          | `PlayerDetails` (avatar, level, fullName, stats, social)  |
| Recent games  | `player.library` (4 premiers)                             |
| Achievements  | `useAchievements(playerId, locale)` (3 unlocked premiers) |
| Note moyenne  | `player.stats.averageRating` + `totalGames`               |
| Latest post   | `usePlayerPosts(playerId)` (premier post)                 |
| Friends count | `useFriendRelationship(playerId).friendCount`             |
| Onglets       | Inchangés — tous les tabs existants restent fonctionnels  |

## Comparaison de bibliothèque

`<LibraryComparisonSection>` reste affichée en dessous du bento quand on visite
le profil d'un autre joueur (utilisateur connecté). La fonction
`shouldShowComparison(isAuthenticated, currentUserId, targetPlayerId)` est
exportée pour les tests property-based.

## Hooks utilisés

- `useAuth` — session courante
- `useFriendRelationship` — count + status (lightweight)
- `useAchievements` — achievements + xpStats
- `usePlayerPosts` — posts du joueur
- `useTranslations` — i18n (`players.details.editorial.*`)

## SEO

- `generateMetadata` : titre, description, OG (inchangé via
  `PlayerService.generatePlayerMetadata`)

## Mobile

- Avatar centré, max-width 460px
- Identité empilée, mini stats sur 3 cols même en mobile
- Bento : 1 col mobile, 2 cols tablet, 3 cols desktop
- Tabs : scroll horizontal sans scrollbar visible

## i18n

Toutes les nouvelles clés sous `players.details.editorial.*` dans
`src/messages/{fr,en}.json` :

- `editorial.kicker` / `editorial.kickerNoLevel` / `editorial.rankBadge`
- `editorial.stats.*` — labels mini stats
- `editorial.bento.*` — kickers et helpers du bento

## Tests

- Tests existants conservés : `test/unit/lib/services/playerService.test.ts`,
  `test/unit/hooks/useFriendRelationship.test.ts`
- Pas de nouveau test requis — la logique métier (services + hooks) est
  inchangée, seul le visuel a été refait.
