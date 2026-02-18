# Requirements Document

## Introduction

Système de recommandations de jeux « Si vous aimez ce jeu, vous aimerez aussi… »
pour Game Universe. Le système suggère des jeux pertinents en se basant sur les
genres partagés, les bibliothèques similaires d'autres joueurs (filtrage
collaboratif), et les notes des reviews. Les recommandations sont affichées sur
la page de détail d'un jeu et sur le profil du joueur connecté.

## Glossaire

- **Recommendation_Engine** : Module serveur qui calcule les jeux recommandés à
  partir des données existantes (genres, bibliothèques, reviews).
- **Genre_Score** : Score de similarité entre deux jeux basé sur le nombre de
  genres partagés, normalisé par le nombre total de genres distincts des deux
  jeux (coefficient de Jaccard).
- **Collaborative_Score** : Score de similarité entre deux jeux basé sur la
  co-occurrence dans les bibliothèques des joueurs. Deux jeux souvent possédés
  ensemble par les mêmes joueurs obtiennent un score élevé.
- **Review_Score** : Note moyenne d'un jeu calculée à partir des reviews des
  joueurs (échelle 0-20).
- **Combined_Score** : Score final de recommandation combinant le Genre_Score,
  le Collaborative_Score et le Review_Score avec des pondérations configurables.
- **Recommendation_Card** : Composant UI affichant un jeu recommandé avec sa
  couverture, son titre, ses genres et son score de pertinence.
- **Player_Library** : Ensemble des jeux dans la bibliothèque d'un joueur (table
  `user_library`).

## Requirements

### Requirement 1: Calcul des recommandations par genres

**User Story:** En tant que joueur, je veux voir des jeux similaires basés sur
les genres, afin de découvrir des jeux du même style que ceux que j'apprécie.

#### Acceptance Criteria

1. WHEN a game detail page is loaded, THE Recommendation_Engine SHALL compute a
   Genre_Score for each candidate game using the Jaccard coefficient over shared
   genres
2. WHEN two games share zero genres, THE Recommendation_Engine SHALL assign a
   Genre_Score of zero to that pair
3. WHEN computing Genre_Score, THE Recommendation_Engine SHALL exclude the
   source game from the candidate list

### Requirement 2: Calcul des recommandations par filtrage collaboratif

**User Story:** En tant que joueur, je veux recevoir des suggestions basées sur
ce que d'autres joueurs ayant des goûts similaires possèdent, afin de découvrir
des jeux que je n'aurais pas trouvés seul.

#### Acceptance Criteria

1. WHEN computing recommendations, THE Recommendation_Engine SHALL calculate a
   Collaborative_Score based on the number of Player_Library entries that
   contain both the source game and the candidate game
2. WHEN fewer than 2 Player_Library entries contain the source game, THE
   Recommendation_Engine SHALL rely solely on Genre_Score and Review_Score for
   that game
3. WHEN computing Collaborative_Score, THE Recommendation_Engine SHALL only
   consider Player_Library entries with status "owned", "completed", or
   "playing"

### Requirement 3: Intégration du Review_Score

**User Story:** En tant que joueur, je veux que les recommandations favorisent
les jeux bien notés, afin de recevoir des suggestions de qualité.

#### Acceptance Criteria

1. WHEN computing recommendations, THE Recommendation_Engine SHALL incorporate
   the Review_Score as a weighting factor in the Combined_Score
2. WHEN a candidate game has no reviews, THE Recommendation_Engine SHALL use a
   neutral Review_Score that neither boosts nor penalizes the candidate
3. WHEN a candidate game has fewer than 3 reviews, THE Recommendation_Engine
   SHALL apply a confidence discount to the Review_Score proportional to the
   number of reviews

### Requirement 4: Calcul du score combiné et classement

**User Story:** En tant que joueur, je veux que les recommandations soient
classées par pertinence, afin de voir les suggestions les plus adaptées en
premier.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL compute a Combined_Score as a weighted sum:
   `(w1 × Genre_Score) + (w2 × Collaborative_Score) + (w3 × Review_Score)` where
   w1, w2, w3 are configurable weights
2. WHEN returning recommendations, THE Recommendation_Engine SHALL sort
   candidates by Combined_Score in descending order
3. WHEN returning recommendations, THE Recommendation_Engine SHALL limit the
   result set to a configurable maximum count (default: 10)
4. WHEN a candidate game is already in the authenticated player's
   Player_Library, THE Recommendation_Engine SHALL exclude that candidate from
   the results

### Requirement 5: API de recommandations

**User Story:** En tant que développeur front-end, je veux une API REST pour
récupérer les recommandations, afin de les afficher dans l'interface
utilisateur.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/games/[slug]/recommendations`, THE
   Recommendation_Engine SHALL return a JSON array of recommended games with
   their Combined_Score
2. WHEN the requested game slug does not exist, THE Recommendation_Engine SHALL
   return a 404 status code with a descriptive error message
3. WHEN an optional `limit` query parameter is provided, THE
   Recommendation_Engine SHALL return at most that number of recommendations
4. THE Recommendation_Engine SHALL include for each recommended game: id, slug,
   title, coverImage, genres, developer, and combinedScore
5. WHEN the request includes an authenticated user, THE Recommendation_Engine
   SHALL exclude games already in that user's Player_Library

### Requirement 6: Affichage des recommandations sur la page jeu

**User Story:** En tant que joueur, je veux voir une section « Si vous aimez ce
jeu, vous aimerez aussi… » sur la page de détail d'un jeu, afin de naviguer
facilement vers des jeux similaires.

#### Acceptance Criteria

1. WHEN a game detail page is displayed, THE Recommendation_Card section SHALL
   appear below the existing game information
2. WHEN recommendations are loading, THE Recommendation_Card section SHALL
   display skeleton placeholders
3. WHEN no recommendations are available, THE Recommendation_Card section SHALL
   display a message indicating no similar games were found
4. WHEN a Recommendation_Card is clicked, THE Recommendation_Card section SHALL
   navigate the player to the selected game's detail page

### Requirement 7: Recommandations personnalisées sur le profil joueur

**User Story:** En tant que joueur connecté, je veux voir des recommandations
personnalisées sur mon profil, basées sur l'ensemble de ma bibliothèque, afin de
découvrir de nouveaux jeux adaptés à mes goûts.

#### Acceptance Criteria

1. WHEN an authenticated player views their profile, THE Recommendation_Engine
   SHALL aggregate recommendations across all games in the player's
   Player_Library
2. WHEN aggregating recommendations, THE Recommendation_Engine SHALL deduplicate
   candidates and keep the highest Combined_Score for each candidate
3. WHEN the player's Player_Library is empty, THE Recommendation_Card section
   SHALL display a message encouraging the player to add games to their library

### Requirement 8: Performance et mise en cache

**User Story:** En tant que joueur, je veux que les recommandations se chargent
rapidement, afin de ne pas attendre lors de la navigation.

#### Acceptance Criteria

1. WHEN recommendations are requested, THE Recommendation_Engine SHALL respond
   within 500ms for a catalog of up to 1000 games
2. WHEN the same recommendations are requested within a configurable TTL
   (default: 1 hour), THE Recommendation_Engine SHALL serve cached results
3. WHEN a game's genres or a player's library changes, THE Recommendation_Engine
   SHALL invalidate the relevant cached recommendations

### Requirement 9: Sérialisation des résultats de recommandation

**User Story:** En tant que développeur, je veux que les résultats de
recommandation soient sérialisables en JSON et désérialisables sans perte, afin
de pouvoir les stocker en cache et les transmettre via l'API.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL serialize recommendation results to JSON
   format
2. FOR ALL valid recommendation result objects, serializing then deserializing
   SHALL produce an equivalent object (round-trip property)
