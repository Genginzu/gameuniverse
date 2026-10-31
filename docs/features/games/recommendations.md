# Recommandations de jeux

## Description

Deux usages, un seul moteur SQL (migration
`20261024000002_recommendation_engine.sql`) :

- **Pour toi** : recommandations personnelles (accueil connecté, profil).
- **Jeux similaires** : jeux proches d'un jeu donné (page détail, quand IGDB ne
  fournit pas de jeux similaires utilisables).

Tout le catalogue est noté en une seule requête (`recommend_games`), environ
1 s pour une bibliothèque de 1 000 jeux. Rien n'est mis en cache côté serveur :
chaque appel reflète la bibliothèque et les choix « pas intéressé » actuels.

### Score

`recommend_games(sources, poids, exclus, limite)` combine, pour chaque jeu du
catalogue :

| Signal        | Poids | Calcul                                                                   |
| ------------- | ----- | ------------------------------------------------------------------------ |
| Contenu       | 50 %  | Cosinus TF-IDF sur genres, thèmes, perspectives, modes, franchises, studios |
| Similaires    | 35 %  | `game_similar_games` d'IGDB, dans les deux sens, résolus par `igdb_id`  |
| Collaboratif  | 15 %  | Co-occurrence dans les bibliothèques, actif à partir de 20 joueurs (≥ 5 jeux) |
| Qualité       | ×0,7 → ×1 | Metascore, avis du site, popularité : multiplie la pertinence       |

- **TF-IDF** : une caractéristique rare (franchise, studio, thème de niche) pèse
  plus qu'une caractéristique courante (« Indie », « Single player »). Poids par
  type : franchise 2, studio 1,5, genre et thème 1, perspective 0,6, mode 0,4.
  En dessous de 5 caractéristiques, la correspondance est atténuée.
- **Sans assez de joueurs**, le signal collaboratif est désactivé et les autres
  sont re-normalisés.
- **Exclus** : jeux de la bibliothèque, jeux « pas intéressé », jeux adultes,
  jeux sans pochette, DLC / bundles / packs importés comme jeux.
- **Diversité** : au plus deux jeux par franchise.

### Poids des jeux de la bibliothèque (personnel)

`library_engagement_weight` : 0,15 + 1,5 × ln(1 + heures de jeu) + statut (en
cours 2, terminé 1,5, liste de souhaits 0,6) + note (5★ +2, 4★ +1, 2★ −0,5,
1★ −1,5), ×1,25 si ajouté il y a moins de 60 jours. Les 80 jeux les plus
engageants servent de sources : un jeu importé mais jamais lancé pèse peu.

### Métadonnées IGDB

Thèmes, modes de jeu, perspectives et franchises sont stockés dans `themes`,
`game_modes`, `player_perspectives`, `franchises` (+ tables de liaison
`game_*`), par `igdb_id`. Ils sont écrits par la RPC `set_games_metadata` à
l'import, à la synchro (un champ suivi par type) et par les webhooks IGDB ; la
RPC garde aussi `games.is_adult` aligné sur le thème 42. Voir
[game-metadata.md](./game-metadata.md).

## Accès

| Route                                                  | Méthode | Auth        | Limite                          |
| ------------------------------------------------------ | ------- | ----------- | ------------------------------- |
| `/api/recommendations/personal?limit=&locale=`         | GET     | Requise     | `recommendation` (60 / 10 min)  |
| `/api/games/[slug]/recommendations?limit=&locale=`     | GET     | Optionnelle | —                               |
| `/api/recommendations/dismissals` `{ gameId }`         | POST    | Requise     | `recommendationFeedback`        |
| `/api/recommendations/dismissals/[gameId]`             | DELETE  | Requise     | `recommendationFeedback`        |

Pages : accueil connecté (section Recommandations), profil du joueur (onglet
recommandations), page détail d'un jeu (repli de « Jeux similaires »).

## Prérequis

1. Appliquer les migrations `20261024000002_recommendation_engine.sql` puis
   `20261025000001_drop_recommendation_reason.sql` (retire `reason_game_id`).
2. Remplir les métadonnées IGDB du catalogue existant (une fois, reprenable) :

   ```bash
   bun --env-file=.env scripts/igdb-import/games/backfill-metadata.ts [--dry-run] [--limit=N]
   ```

   500 jeux par requête IGDB, environ 50 requêtes pour 25 000 jeux. Sans
   backfill, le moteur fonctionne avec genres, studios et jeux similaires.

## Utilisation

- **Pas intéressé** : bouton (œil barré) en haut à gauche d'une carte de la
  section Recommandations. Le jeu disparaît aussitôt et n'est plus proposé ;
  « Annuler » le rétablit.
- **Bibliothèque / liste de souhaits** : l'ajout rapide commun des cartes
  ([quick-add.md](../library/quick-add.md)), sous le précédent. Le jeu ajouté
  (`POST /api/library`, statut « possédé » ou `wishlist`) quitte aussitôt le rail
  et un message avec un lien vers sa fiche confirme l'ajout.
- **Recalculer** : relance le calcul (pas de cache serveur, donc toujours à
  jour).

## Architecture

```
supabase/migrations/20261024000002_recommendation_engine.sql
supabase/migrations/20261025000001_drop_recommendation_reason.sql
  recommend_games / recommend_games_for_me / recommend_similar_games
  library_engagement_weight / set_games_taxonomies
src/lib/services/recommendationService.ts   # RPC + métadonnées des cartes
src/lib/services/recommendation/            # client, métadonnées localisées
src/lib/services/igdbTaxonomies.ts          # champs IGDB, écriture des taxonomies
src/hooks/usePersonalRecommendations.ts, useRecommendations.ts
src/hooks/useRecommendationDismissal.ts, useDismissWithUndo.ts
src/components/home/dashboard/RecommendationsSection.tsx
```
