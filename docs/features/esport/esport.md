# Esport — Fonctionnalités

## Description

Module esport complet intégrant les données PandaScore pour afficher les
tournois professionnels, résultats, équipes, joueurs pro et streams en direct.
Inclut également un système de rangs compétitifs via les APIs des jeux (Riot,
Blizzard, Faceit).

## Pages

| Route                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `/esport/calendar`     | Calendrier des tournois (upcoming + running)    |
| `/esport/results`      | Résultats récents des matchs terminés           |
| `/esport/teams`        | Liste des équipes pro avec recherche            |
| `/esport/teams/[id]`   | Fiche équipe : logo, infos, roster              |
| `/esport/players`      | Liste des joueurs pro avec recherche            |
| `/esport/players/[id]` | Fiche joueur : photo, rôle, équipe, nationalité |
| `/esport/live`         | Streams en direct des matchs en cours           |

## Architecture

### Services

| Service                 | Fichier                                     | Rôle                                            |
| ----------------------- | ------------------------------------------- | ----------------------------------------------- |
| `esportCalendarService` | `src/lib/services/esportCalendarService.ts` | Tournois upcoming/running, cache 15min          |
| `esportResultsService`  | `src/lib/services/esportResultsService.ts`  | Tournois passés + matchs terminés, cache 15min  |
| `esportTeamService`     | `src/lib/services/esportTeamService.ts`     | Liste/détail équipes avec roster, cache 15min   |
| `esportPlayerService`   | `src/lib/services/esportPlayerService.ts`   | Liste/détail joueurs pro, cache 15min           |
| `esportLiveService`     | `src/lib/services/esportLiveService.ts`     | Streams extraits des matchs running, cache 2min |
| `gameRankService`       | `src/lib/services/gameRankService.ts`       | Rangs compétitifs multi-jeux, cache 1h          |

### API Routes

| Route                          | Méthode | Description                                    |
| ------------------------------ | ------- | ---------------------------------------------- |
| `/api/esport/calendar`         | GET     | `?game=` filtre, `?games_only=true` liste jeux |
| `/api/esport/results`          | GET     | `?game=` filtre                                |
| `/api/esport/teams`            | GET     | `?search=` recherche                           |
| `/api/esport/teams/[id]`       | GET     | Détail équipe + roster                         |
| `/api/esport/players`          | GET     | `?search=` recherche                           |
| `/api/esport/players/[id]`     | GET     | Détail joueur                                  |
| `/api/esport/live`             | GET     | `?game=` filtre                                |
| `/api/players/[id]/game-ranks` | GET     | Rangs compétitifs                              |

### PandaScore Client

`src/lib/pandascore/client.ts` — Client HTTP pour l'API PandaScore avec les
endpoints : videogames, tournaments (all/upcoming/running/past), matches
(all/upcoming/running/past), teams, players.

### Composants

Tous dans `src/components/esport/` :

- `EsportCalendarContent` — Grille de cartes tournois avec filtres par jeu
- `EsportResultsContent` — Liste de matchs avec scores et winner highlighting
- `EsportTeamsContent` — Grille d'équipes avec recherche
- `EsportTeamDetailContent` — Header équipe + grille roster
- `EsportPlayersContent` — Grille de joueurs avec recherche
- `EsportPlayerDetailContent` — Profil joueur avec badges
- `EsportLiveContent` — Cartes de streams live avec auto-refresh 2min

## Prérequis

- Variable d'environnement `PANDASCORE_API_KEY` configurée
- Optionnel pour les rangs : `RIOT_API_KEY`, `BLIZZARD_ACCESS_TOKEN`,
  `FACEIT_API_KEY`

## i18n

Namespace `esport` dans `src/messages/fr.json` et `en.json` avec sous-namespaces
: `calendar`, `results`, `teams`, `players`, `live`. Namespace
`player.gameRanks` pour les rangs compétitifs.

## Tests

33 tests unitaires dans `test/unit/lib/services/` couvrant les 6 services esport
:

- `esportCalendarService.test.ts` (6 tests)
- `esportResultsService.test.ts` (4 tests)
- `esportTeamService.test.ts` (5 tests)
- `esportPlayerService.test.ts` (5 tests)
- `esportLiveService.test.ts` (6 tests)
- `gameRankService.test.ts` (6 tests)
- `client.test.ts` (11 tests PandaScore client)
