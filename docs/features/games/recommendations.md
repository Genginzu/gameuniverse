# Game Recommendations

## Description

Système de recommandations de jeux « Si vous aimez ce jeu, vous aimerez aussi…
». Le moteur combine quatre signaux pour calculer un score de pertinence :

1. **Similarité par genres** — coefficient de Jaccard sur les genres partagés
2. **Filtrage collaboratif** — co-occurrence dans les bibliothèques des joueurs
3. **Qualité des reviews** — note moyenne pondérée par un discount de confiance
4. **Note Metacritic** — metascore normalisé (0-100 → 0-1), signal optionnel

Les scores sont combinés en un `Combined_Score` avec des poids configurables
(genre 0.35, collaboratif 0.35, review 0.15, metacritic 0.15). Quand un jeu n'a
pas de metascore, ce signal est exclu et les poids restants sont re-normalisés
automatiquement. Les résultats sont servis via une API REST avec cache in-memory
(TTL 1h).

## Accès

### API Routes

| Route                                       | Méthode | Auth        | Description                              |
| ------------------------------------------- | ------- | ----------- | ---------------------------------------- |
| `/api/games/[slug]/recommendations?limit=N` | GET     | Optionnelle | Recommandations pour un jeu donné        |
| `/api/recommendations/personal?limit=N`     | GET     | Requise     | Recommandations personnalisées du joueur |

### Pages

- **Page de détail d'un jeu** (`/[locale]/games/[slug]`) — section « Si vous
  aimez ce jeu… » en bas de page
- **Profil du joueur** (`/[locale]/players/[id]`) — section « Recommandations
  pour vous » visible uniquement par le propriétaire du profil

## Prérequis

Aucune migration SQL nécessaire. Le système exploite les tables existantes :

- `game_genres` — pour le Genre_Score
- `user_library` — pour le Collaborative_Score (statuts `owned`, `completed`,
  `playing`)
- `game_reviews` — pour le Review_Score
- `games` — pour le Metacritic_Score (colonne `metascore`)
- `games`, `game_translations`, `game_companies` — métadonnées des candidats

## Utilisation

### Recommandations par jeu

La section apparaît automatiquement sur chaque page de détail de jeu. Si
l'utilisateur est authentifié, les jeux déjà dans sa bibliothèque sont exclus
des résultats.

### Recommandations personnalisées

Visible sur le profil du joueur connecté. Le moteur agrège les recommandations
de tous les jeux de la bibliothèque, déduplique les candidats en gardant le
score maximum, et exclut les jeux déjà possédés.

Si la bibliothèque est vide, un message invite le joueur à ajouter des jeux.

## Architecture

```
src/lib/services/recommendation/
├── genreScorer.ts          # Coefficient de Jaccard
├── collaborativeScorer.ts  # Co-occurrence normalisée
├── reviewScorer.ts         # Note moyenne + discount confiance
├── metacriticScorer.ts     # Metascore normalisé (signal optionnel)
├── scoreCombiner.ts        # Somme pondérée normalisée (signaux optionnels)
├── cache.ts                # Cache in-memory avec TTL
├── dataFetchers.ts         # Requêtes Supabase
└── index.ts                # Barrel export

src/lib/services/recommendationService.ts  # Orchestration

src/hooks/
├── useRecommendations.ts          # Hook pour un jeu
└── usePersonalRecommendations.ts  # Hook pour le profil

src/components/games/
├── RecommendationSection.tsx          # Section page jeu
└── PersonalRecommendationSection.tsx  # Section profil joueur
```
