# Design Document: Game Recommendations

## Overview

Le système de recommandations calcule des suggestions de jeux en combinant trois
signaux :

1. **Similarité par genres** (Jaccard coefficient sur les genres partagés)
2. **Filtrage collaboratif** (co-occurrence dans les bibliothèques des joueurs)
3. **Qualité des reviews** (note moyenne pondérée par la confiance)

Les scores sont combinés en un `Combined_Score` avec des poids configurables,
puis servis via une API REST. Les résultats sont mis en cache côté serveur avec
un TTL configurable.

L'architecture s'intègre dans le pattern existant du projet : service layer dans
`src/lib/services/`, API routes Next.js dans `src/app/api/`, types partagés dans
`src/types/`, composants dans `src/components/games/`.

## Architecture

```mermaid
graph TD
    A[Game Detail Page] -->|GET /api/games/[slug]/recommendations| B[API Route]
    C[Player Profile Page] -->|GET /api/recommendations/personal| B2[Personal API Route]

    B --> D[RecommendationService]
    B2 --> D

    D --> E[GenreScorer]
    D --> F[CollaborativeScorer]
    D --> G[ReviewScorer]

    E --> H[(Supabase: game_genres)]
    F --> I[(Supabase: user_library)]
    G --> J[(Supabase: game_reviews)]

    D --> K[ScoreCombiner]
    K --> L[Cache Layer]
    L --> M[JSON Response]
```

### Flux de données

1. Le client appelle l'API de recommandations avec un slug de jeu (ou un user ID
   pour les recommandations personnalisées)
2. L'API route délègue au `RecommendationService`
3. Le service vérifie le cache ; si miss, il calcule les scores via les trois
   scorers
4. Les scores sont combinés par le `ScoreCombiner` avec les poids configurés
5. Les résultats sont triés, filtrés (exclusion de la bibliothèque du joueur si
   authentifié), limités, et mis en cache
6. La réponse JSON est renvoyée au client

## Components and Interfaces

### 1. Scoring Functions (src/lib/services/recommendation/)

Trois fonctions pures de scoring, chacune dans son propre fichier :

**genreScorer.ts**

```typescript
interface GenreScoreInput {
  sourceGenreIds: string[];
  candidateGenreIds: string[];
}

/** Calcule le coefficient de Jaccard entre deux ensembles de genres */
function computeGenreScore(input: GenreScoreInput): number;
```

**collaborativeScorer.ts**

```typescript
interface CollaborativeScoreInput {
  sourceGameId: string;
  candidateGameId: string;
  coOccurrenceCount: number; // nombre de bibliothèques contenant les deux jeux
  sourceGameLibraryCount: number; // nombre total de bibliothèques contenant le jeu source
}

/** Calcule le score collaboratif basé sur la co-occurrence normalisée */
function computeCollaborativeScore(input: CollaborativeScoreInput): number;
```

**reviewScorer.ts**

```typescript
interface ReviewScoreInput {
  averageRating: number | null; // note moyenne 0-20, null si aucune review
  reviewCount: number;
  minReviewsForFullConfidence: number; // default: 3
}

/** Calcule le score de review normalisé [0,1] avec discount de confiance */
function computeReviewScore(input: ReviewScoreInput): number;
```

### 2. Score Combiner (src/lib/services/recommendation/scoreCombiner.ts)

```typescript
interface ScoringWeights {
  genre: number; // default: 0.4
  collaborative: number; // default: 0.4
  review: number; // default: 0.2
}

interface CandidateScores {
  genreScore: number;
  collaborativeScore: number;
  reviewScore: number;
}

/** Combine les trois scores avec les poids configurés */
function computeCombinedScore(
  scores: CandidateScores,
  weights: ScoringWeights
): number;
```

### 3. RecommendationService (src/lib/services/recommendationService.ts)

```typescript
interface RecommendationOptions {
  limit?: number; // default: 10
  excludeGameIds?: string[]; // jeux à exclure (bibliothèque du joueur)
  weights?: Partial<ScoringWeights>;
}

interface GameRecommendation {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  genres: Array<{ id: string; name: string }>;
  developer: string;
  combinedScore: number;
}

class RecommendationService {
  /** Recommandations pour un jeu spécifique */
  static async getRecommendationsForGame(
    gameId: string,
    options?: RecommendationOptions
  ): Promise<GameRecommendation[]>;

  /** Recommandations personnalisées pour un joueur */
  static async getPersonalRecommendations(
    userId: string,
    options?: RecommendationOptions
  ): Promise<GameRecommendation[]>;
}
```

### 4. API Routes

**src/app/api/games/[slug]/recommendations/route.ts**

- `GET /api/games/[slug]/recommendations?limit=10`
- Retourne les recommandations pour un jeu donné
- Si l'utilisateur est authentifié, exclut les jeux de sa bibliothèque

**src/app/api/recommendations/personal/route.ts**

- `GET /api/recommendations/personal?limit=10`
- Requiert authentification
- Agrège les recommandations de tous les jeux de la bibliothèque du joueur

### 5. UI Components (src/components/games/)

**RecommendationSection.tsx**

- Section wrapper avec titre « Si vous aimez ce jeu… »
- Gère les états loading/empty/error
- Affiche une grille de `GameCard` existants (réutilisation du composant)

**useRecommendations.ts** (src/hooks/)

- Hook custom pour fetch les recommandations d'un jeu
- Gère loading, error, data states
- Utilise SWR ou fetch natif avec le pattern existant du projet

### 6. Cache Layer

Le cache utilise un simple `Map<string, { data, expiry }>` en mémoire côté
serveur dans le `RecommendationService`. Pour un catalogue de ≤1000 jeux, un
cache in-memory est suffisant. La clé de cache est composée de `gameId` (ou
`userId` pour les recommandations personnalisées).

L'invalidation se fait par TTL (default: 1 heure). Pas besoin d'invalidation
active pour la V1 — le TTL court suffit pour refléter les changements de
bibliothèques et genres.

## Data Models

### Types partagés (src/types/recommendation.ts)

```typescript
/** Résultat de recommandation pour un jeu */
export interface GameRecommendation {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  genres: Array<{ id: string; name: string }>;
  developer: string;
  combinedScore: number;
}

/** Réponse de l'API de recommandations */
export interface RecommendationsResponse {
  recommendations: GameRecommendation[];
  sourceGameId: string;
  generatedAt: string;
}

/** Réponse de l'API de recommandations personnalisées */
export interface PersonalRecommendationsResponse {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
  generatedAt: string;
}

/** Configuration des poids de scoring */
export interface ScoringWeights {
  genre: number;
  collaborative: number;
  review: number;
}

/** Scores individuels d'un candidat */
export interface CandidateScores {
  genreScore: number;
  collaborativeScore: number;
  reviewScore: number;
}
```

### Requêtes Supabase

Aucune nouvelle table n'est nécessaire. Le système exploite les tables
existantes :

- **game_genres** : pour calculer le Genre_Score (Jaccard sur les genre_id
  partagés)
- **user_library** : pour calculer le Collaborative_Score (co-occurrence, filtré
  par status IN ('owned', 'completed', 'playing'))
- **game_reviews** : pour calculer le Review_Score (AVG(rating), COUNT)
- **game_translations** : pour récupérer les titres localisés
- **games** : pour les métadonnées des candidats (slug, cover_image_url)
- **game_companies** : pour le nom du développeur

### Requête SQL pour la co-occurrence collaborative

```sql
-- Pour un jeu source donné, trouver les jeux co-occurrents dans les bibliothèques
SELECT
  ul2.game_id AS candidate_game_id,
  COUNT(DISTINCT ul2.user_id) AS co_occurrence_count
FROM user_library ul1
JOIN user_library ul2
  ON ul1.user_id = ul2.user_id
  AND ul1.game_id != ul2.game_id
WHERE ul1.game_id = :source_game_id
  AND ul1.status IN ('owned', 'completed', 'playing')
  AND ul2.status IN ('owned', 'completed', 'playing')
GROUP BY ul2.game_id
ORDER BY co_occurrence_count DESC;
```

### Requête SQL pour les stats de reviews par jeu

```sql
SELECT
  game_id,
  AVG(rating)::NUMERIC(5,2) AS average_rating,
  COUNT(*) AS review_count
FROM game_reviews
GROUP BY game_id;
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system — essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property 1: Jaccard coefficient correctness

_For any_ two non-empty sets of genre IDs (source and candidate), the
Genre_Score should equal the size of their intersection divided by the size of
their union. When both sets are empty, the score should be 0. When the
intersection is empty, the score should be 0.

**Validates: Requirements 1.1, 1.2**

### Property 2: Source game exclusion

_For any_ source game and any set of candidate games, the list of
recommendations returned by the Recommendation_Engine should never contain the
source game itself.

**Validates: Requirements 1.3**

### Property 3: Collaborative score with status filtering

_For any_ source game and candidate game, the Collaborative_Score should be
computed only from Player_Library entries with status "owned", "completed", or
"playing". Entries with status "wishlist" should not contribute to the
co-occurrence count. When fewer than 2 libraries contain the source game, the
Collaborative_Score should be 0.

**Validates: Requirements 2.1, 2.3, 2.2**

### Property 4: Review score confidence discount

_For any_ candidate game with a review count below the minimum confidence
threshold (3), the Review_Score should be discounted proportionally to
`reviewCount / minReviewsForFullConfidence`. When a game has no reviews, the
Review_Score should be 0.5 (neutral).

**Validates: Requirements 3.3, 3.2**

### Property 5: Combined score is a weighted sum

_For any_ three scores (genre, collaborative, review) in [0, 1] and any positive
weights (w1, w2, w3), the Combined_Score should equal
`(w1 * genreScore + w2 * collaborativeScore + w3 * reviewScore) / (w1 + w2 + w3)`.

**Validates: Requirements 4.1, 3.1**

### Property 6: Output sorted by descending score

_For any_ list of recommendations returned by the Recommendation_Engine, each
item's `combinedScore` should be greater than or equal to the next item's
`combinedScore`.

**Validates: Requirements 4.2**

### Property 7: Output respects limit

_For any_ positive integer limit N and any set of candidate games, the list of
recommendations returned should contain at most N items.

**Validates: Requirements 4.3, 5.3**

### Property 8: Library exclusion

_For any_ authenticated player and any set of recommendations, no recommended
game's ID should appear in the player's Player_Library game IDs.

**Validates: Requirements 4.4, 5.5**

### Property 9: Deduplication keeps max score

_For any_ set of recommendation lists from multiple source games, after
aggregation, each candidate game should appear at most once, and its
`combinedScore` should equal the maximum `combinedScore` it received across all
source games.

**Validates: Requirements 7.2**

### Property 10: Recommendation serialization round-trip

_For any_ valid `RecommendationsResponse` object, serializing it to JSON and
then deserializing it back should produce an object deeply equal to the
original.

**Validates: Requirements 9.1, 9.2**

### Property 11: Response contains required fields

_For any_ `GameRecommendation` object in the API response, the object should
contain non-undefined values for: `id`, `slug`, `title`, `coverImage` (may be
null), `genres`, `developer`, and `combinedScore`.

**Validates: Requirements 5.4**

## Error Handling

| Scenario                                                        | Comportement                                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Slug de jeu inexistant                                          | API retourne 404 avec `{ error: "Game not found" }`                                                  |
| Utilisateur non authentifié sur `/api/recommendations/personal` | API retourne 401 avec `{ error: "Unauthorized" }`                                                    |
| Erreur Supabase lors du fetch des genres/bibliothèques          | API retourne 500 avec `{ error: "Failed to compute recommendations" }`, log de l'erreur côté serveur |
| Aucun candidat trouvé                                           | API retourne 200 avec `{ recommendations: [], ... }`                                                 |
| Paramètre `limit` invalide (non-numérique, négatif)             | API utilise la valeur par défaut (10)                                                                |
| Bibliothèque du joueur vide (recommandations personnalisées)    | API retourne 200 avec `{ recommendations: [], basedOnGameCount: 0, ... }`                            |

## Testing Strategy

### Property-Based Testing

Bibliothèque : **fast-check** (compatible Bun, TypeScript natif)

Chaque propriété du design sera implémentée comme un test property-based avec
minimum 100 itérations. Les fichiers de test suivent la convention
`*.property.test.ts` dans `test/unit/lib/services/`.

Configuration :

```typescript
import fc from "fast-check";
import { describe, it, expect } from "bun:test";

// Chaque test référence sa propriété du design
// Feature: game-recommendations, Property N: <title>
```

Les fonctions de scoring sont pures et prennent des inputs simples (tableaux de
strings, nombres), ce qui les rend idéales pour le property-based testing avec
des générateurs fast-check standards (`fc.array(fc.uuid())`, `fc.integer()`,
`fc.float()`).

### Unit Testing

Les tests unitaires complètent les property tests pour :

- Les cas limites spécifiques (0 genres, 0 reviews, bibliothèque vide)
- Les intégrations API (mock Supabase, vérification des status codes)
- Les composants UI (états loading, empty, error)

Fichiers dans `test/unit/lib/services/` et `test/unit/hooks/` et
`test/unit/components/games/`.

### Test Organization

```
test/
├── unit/
│   ├── lib/
│   │   └── services/
│   │       ├── recommendation/
│   │       │   ├── genreScorer.test.ts
│   │       │   ├── genreScorer.property.test.ts
│   │       │   ├── collaborativeScorer.test.ts
│   │       │   ├── collaborativeScorer.property.test.ts
│   │       │   ├── reviewScorer.test.ts
│   │       │   ├── reviewScorer.property.test.ts
│   │       │   ├── scoreCombiner.test.ts
│   │       │   └── scoreCombiner.property.test.ts
│   │       └── recommendationService.test.ts
│   ├── hooks/
│   │   └── useRecommendations.test.ts
│   └── components/
│       └── games/
│           └── RecommendationSection.test.tsx
```
