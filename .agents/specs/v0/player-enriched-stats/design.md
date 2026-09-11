# Document de Design : Statistiques Joueur Enrichies

## Vue d'ensemble

Cette fonctionnalité ajoute des statistiques avancées au profil joueur en
exploitant les données existantes des tables `user_library`, `game_reviews`,
`game_genres` et `genre_translations`. Les calculs sont effectués côté serveur
via des endpoints API dédiés. Une page « Année en Revue » offre un résumé annuel
visuel inspiré du Spotify Wrapped.

L'architecture s'appuie sur le pattern existant du projet : service métier
(`playerStatsService.ts`), routes API Next.js, et composants React côté client.

## Architecture

```mermaid
graph TD
    subgraph Client
        A[PlayerDetailsContent] --> B[PlayerEnrichedStats]
        C[YearInReviewPage] --> D[YearInReviewContent]
    end

    subgraph API Routes
        E[GET /api/players/:id/stats]
        F[GET /api/players/:id/year/:year]
    end

    subgraph Services
        G[PlayerStatsService]
    end

    subgraph Database
        H[(user_library)]
        I[(game_reviews)]
        J[(game_genres)]
        K[(genre_translations)]
        L[(profiles)]
    end

    B -->|fetch| E
    D -->|fetch| F
    E --> G
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
end
```

### Flux de données

1. Le composant client appelle l'API via `fetch`
2. La route API délègue au `PlayerStatsService`
3. Le service exécute les requêtes Supabase et agrège les résultats
4. Les données sont retournées au client pour affichage

## Composants et Interfaces

### Routes API

#### `GET /api/players/[id]/stats`

Retourne les statistiques enrichies d'un joueur.

Paramètres query :

- `locale` (optionnel, défaut : `"fr"`) — locale pour les noms de genres

Réponse :

```json
{
  "stats": {
    "totalPlayTime": 1234.5,
    "favoriteGenre": {
      "name": "RPG",
      "playTime": 456.2
    },
    "reviewCount": 12,
    "averageReviewRating": 14.5
  }
}
```

#### `GET /api/players/[id]/year/[year]`

Retourne le résumé annuel d'un joueur.

Paramètres query :

- `locale` (optionnel, défaut : `"fr"`)

Réponse :

```json
{
  "yearReview": {
    "year": 2024,
    "totalPlayTime": 320.5,
    "gamesAdded": 15,
    "favoriteGenre": {
      "name": "Action",
      "playTime": 120.0
    },
    "topGame": {
      "id": "uuid",
      "title": "Elden Ring",
      "coverImage": "url",
      "playTime": 85.0
    },
    "reviewCount": 5,
    "mostActiveMonth": {
      "month": 3,
      "gamesAdded": 5
    },
    "availableYears": [2023, 2024]
  }
}
```

### Composants React

#### `PlayerEnrichedStats`

- Emplacement : `src/components/players/PlayerEnrichedStats.tsx`
- Affiche les stats enrichies (temps total, genre favori, reviews) dans des
  cartes sur la page profil
- Reçoit `playerId`, `locale`, `isOwnProfile`, `statsPrivate` en props
- Gère le chargement (skeleton) et les erreurs

#### `YearInReviewContent`

- Emplacement : `src/components/players/YearInReviewContent.tsx`
- Page dédiée au résumé annuel avec design visuel engageant
- Affiche les statistiques annuelles dans des cartes colorées
- Inclut un lien retour vers le profil

#### `YearInReviewLink`

- Emplacement : `src/components/players/YearInReviewLink.tsx`
- Lien affiché sur le profil joueur vers le résumé annuel
- Détermine l'année à afficher (année courante ou dernière année avec données)

### Service

#### `PlayerStatsService`

- Emplacement : `src/lib/services/playerStatsService.ts`
- Méthodes statiques :
  - `fetchEnrichedStats(playerId, locale)` → `EnrichedStats`
  - `fetchYearInReview(playerId, year, locale)` → `YearInReview`
  - `fetchAvailableYears(playerId)` → `number[]`
  - `computeFavoriteGenre(libraryWithGenres, locale)` → `FavoriteGenre | null`
  - `computeMostActiveMonth(libraryEntries)` → `MostActiveMonth | null`

### Pages Next.js

#### Page résumé annuel

- Route : `src/app/[locale]/players/[id]/year/[year]/page.tsx`
- Server component qui récupère les données et rend `YearInReviewContent`

## Modèles de données

### Types TypeScript

```typescript
// src/types/player-stats.ts

/** Statistiques enrichies d'un joueur */
export interface EnrichedStats {
  totalPlayTime: number;
  favoriteGenre: FavoriteGenre | null;
  reviewCount: number;
  averageReviewRating: number | null;
}

/** Genre favori avec temps de jeu associé */
export interface FavoriteGenre {
  name: string;
  playTime: number;
}

/** Jeu le plus joué (pour le résumé annuel) */
export interface TopGame {
  id: string;
  title: string;
  coverImage: string | null;
  playTime: number;
}

/** Mois le plus actif */
export interface MostActiveMonth {
  month: number;
  gamesAdded: number;
}

/** Résumé annuel complet */
export interface YearInReview {
  year: number;
  totalPlayTime: number;
  gamesAdded: number;
  favoriteGenre: FavoriteGenre | null;
  topGame: TopGame | null;
  reviewCount: number;
  mostActiveMonth: MostActiveMonth | null;
  availableYears: number[];
}

/** Réponse API pour les stats enrichies */
export interface EnrichedStatsResponse {
  stats: EnrichedStats;
}

/** Réponse API pour le résumé annuel */
export interface YearInReviewResponse {
  yearReview: YearInReview;
}
```

### Migration base de données

Migration : `supabase/migrations/20240221000001_player_stats_privacy.sql`

```sql
-- Ajout de la colonne de confidentialité des statistiques
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stats_private BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.stats_private
IS 'Si true, les statistiques enrichies et le résumé annuel sont masqués pour les visiteurs';
```

### Requêtes SQL clés

#### Calcul du genre favori (pondéré par temps de jeu)

```sql
SELECT
  gt.name AS genre_name,
  SUM(ul.play_time_hours::decimal / genre_count.cnt) AS weighted_play_time
FROM user_library ul
JOIN game_genres gg ON ul.game_id = gg.game_id
JOIN genre_translations gt ON gg.genre_id = gt.genre_id
  AND gt.language_code = $locale
JOIN (
  SELECT game_id, COUNT(*)::decimal AS cnt
  FROM game_genres
  GROUP BY game_id
) genre_count ON ul.game_id = genre_count.game_id
WHERE ul.user_id = $playerId
  AND ul.play_time_hours > 0
GROUP BY gt.name
ORDER BY weighted_play_time DESC, gt.name ASC
LIMIT 1;
```

#### Comptage des reviews et note moyenne

```sql
SELECT
  COUNT(*)::integer AS review_count,
  ROUND(AVG(rating), 1) AS average_rating
FROM game_reviews
WHERE user_id = $playerId;
```

#### Résumé annuel — jeux ajoutés dans l'année

```sql
SELECT ul.*, g.cover_image_url, gt_title.title
FROM user_library ul
JOIN games g ON ul.game_id = g.id
LEFT JOIN game_translations gt_title
  ON g.id = gt_title.game_id AND gt_title.language_code = $locale
WHERE ul.user_id = $playerId
  AND EXTRACT(YEAR FROM ul.added_at) = $year;
```

## Propriétés de Correction

_Une propriété est une caractéristique ou un comportement qui doit rester vrai
pour toutes les exécutions valides d'un système — essentiellement, une
déclaration formelle de ce que le système doit faire. Les propriétés servent de
pont entre les spécifications lisibles par l'humain et les garanties de
correction vérifiables par la machine._

### Property 1 : Somme du temps de jeu total

_Pour toute_ bibliothèque de joueur contenant N entrées avec des valeurs
`play_time_hours` arbitraires (≥ 0), le temps de jeu total retourné par
`fetchEnrichedStats` doit être égal à la somme de toutes les valeurs
`play_time_hours` de la bibliothèque.

**Validates: Requirements 1.1**

### Property 2 : Précision décimale du temps de jeu

_Pour tout_ temps de jeu total calculé, la valeur retournée doit avoir au
maximum une décimale (c'est-à-dire que `value * 10` est un entier).

**Validates: Requirements 1.3**

### Property 3 : Calcul du genre favori avec pondération multi-genre

_Pour toute_ bibliothèque de joueur contenant des jeux avec des genres associés,
le genre favori retourné doit être celui dont le temps de jeu pondéré est le
plus élevé, où le temps de jeu d'un jeu ayant N genres est réparti à parts
égales (temps / N) entre chaque genre. Le résultat doit inclure le nom du genre
et le temps de jeu pondéré total. En cas d'égalité, le genre alphabétiquement
premier est sélectionné.

**Validates: Requirements 2.1, 2.2, 2.4**

### Property 4 : Comptage des reviews et note moyenne

_Pour tout_ ensemble de reviews d'un joueur, le compteur retourné doit être égal
au nombre de reviews, et la note moyenne doit être égale à la moyenne
arithmétique des ratings de toutes les reviews (arrondie à une décimale).

**Validates: Requirements 3.1, 3.3**

### Property 5 : Formatage des nombres selon la locale

_Pour tout_ nombre positif et toute locale supportée (`fr`, `en`), la fonction
de formatage doit produire une chaîne contenant le séparateur de milliers
approprié à la locale et au maximum une décimale.

**Validates: Requirements 4.4**

### Property 6 : Filtrage par année pour le résumé annuel

_Pour toute_ bibliothèque de joueur contenant des entrées réparties sur
plusieurs années, le résumé annuel pour une année donnée doit inclure uniquement
les entrées dont le champ `added_at` tombe dans l'année spécifiée. Le temps de
jeu total et le nombre de jeux ajoutés doivent correspondre exclusivement aux
entrées de cette année.

**Validates: Requirements 5.1**

### Property 7 : Calcul du mois le plus actif

_Pour tout_ ensemble d'entrées de bibliothèque dans une année donnée, le mois le
plus actif retourné doit être celui avec le plus grand nombre d'entrées
ajoutées. Le nombre de jeux ajoutés ce mois-là doit correspondre au compte réel.

**Validates: Requirements 5.5**

### Property 8 : Résolution du lien vers l'année

_Pour tout_ ensemble d'années disponibles (non vide), le lien vers le résumé
annuel doit pointer vers l'année en cours si elle contient des données, sinon
vers la plus récente année ayant des données. Si aucune année n'a de données,
aucun lien ne doit être affiché.

**Validates: Requirements 7.2**

### Property 9 : Visibilité des statistiques selon la confidentialité

_Pour tout_ joueur et tout visiteur, les statistiques enrichies doivent être
visibles si et seulement si le visiteur est le propriétaire du profil OU le
réglage `stats_private` est `false`.

**Validates: Requirements 8.2, 8.3**

## Gestion des erreurs

| Scénario                      | Code HTTP | Comportement                                   |
| ----------------------------- | --------- | ---------------------------------------------- |
| Joueur inexistant             | 404       | Message « Joueur non trouvé »                  |
| ID joueur invalide (non-UUID) | 400       | Message « Format d'identifiant invalide »      |
| Année future                  | 400       | Message « L'année demandée est dans le futur » |
| Erreur réseau (côté client)   | —         | Message d'erreur avec bouton « Réessayer »     |
| Erreur serveur Supabase       | 500       | Message générique, log côté serveur            |
| Stats privées (visiteur)      | 200       | Réponse avec `stats: null` et `private: true`  |

Le service `PlayerStatsService` encapsule les erreurs Supabase et les transforme
en réponses HTTP appropriées. Les composants client gèrent les états d'erreur
via un pattern try/catch avec affichage conditionnel.

## Stratégie de tests

### Framework

- **Bun test** (`bun:test`) — framework de test exclusif du projet
- **fast-check** — bibliothèque de property-based testing pour TypeScript

### Tests unitaires

Emplacement : `test/unit/lib/services/playerStatsService.test.ts`

Tests ciblés sur :

- Cas spécifiques (bibliothèque vide, un seul jeu, un seul genre)
- Cas limites (temps de jeu à 0, genres sans traduction, année sans données)
- Validation des entrées (UUID invalide, année future)
- Formatage des nombres par locale

### Tests property-based

Emplacement : `test/unit/lib/services/playerStatsService.property.test.ts`

Chaque propriété de correction (1-9) est implémentée comme un test
property-based avec un minimum de 100 itérations. Chaque test est annoté avec un
commentaire référençant la propriété du design :

```typescript
// Feature: player-enriched-stats, Property 1: Somme du temps de jeu total
```

### Configuration fast-check

```typescript
import fc from "fast-check";

// Générateurs personnalisés
const libraryEntryArb = fc.record({
  playTimeHours: fc.float({ min: 0, max: 50000, noNaN: true }),
  genres: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
});

const libraryArb = fc.array(libraryEntryArb, { minLength: 0, maxLength: 100 });
```

### Approche duale

- Les **tests unitaires** vérifient des exemples concrets et des cas limites
- Les **tests property-based** vérifient les propriétés universelles sur des
  entrées générées aléatoirement
- Les deux sont complémentaires : les tests unitaires attrapent les bugs
  concrets, les tests property vérifient la correction générale
