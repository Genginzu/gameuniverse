# Player Playtime — Temps de jeu des joueurs

## Description

Fonctionnalité permettant aux joueurs authentifiés de soumettre leur temps de
jeu pour un jeu, réparti en 3 catégories alignées sur la structure IGDB :

- **Rapidement** (hastily) — temps pour finir l'histoire principale
- **Normalement** (normally) — temps pour un parcours standard
- **Complètement** (completely) — temps pour un 100%

Les temps soumis par la communauté sont agrégés en moyennes affichées à côté des
données officielles IGDB.

## Accès

La section temps de jeu est visible dans l'onglet **Playtime** de la page
détails d'un jeu (`/[locale]/games/[slug]`).

- Les données IGDB officielles sont visibles par tous
- Le bouton "Ajouter mon temps" apparaît uniquement pour les utilisateurs
  connectés, au-dessus des cartes IGDB
- Un clic ouvre un Dialog avec les 3 champs de saisie

## Prérequis

- Migration Supabase `20240213000001_player_playtime_three_fields.sql` appliquée
  (ajoute les colonnes `play_time_hastily`, `play_time_normally`,
  `play_time_completely` à `user_library`)
- Utilisateur authentifié pour soumettre un temps de jeu

## Utilisation

1. Naviguer vers la page d'un jeu
2. Aller dans l'onglet Playtime
3. Cliquer sur le bouton "Ajouter mon temps de jeu"
4. Remplir au moins un des 3 champs (en heures, précision 0.1h)
5. Valider — les moyennes communautaires se mettent à jour en temps réel

## API

- `GET /api/games/[slug]/playtime` — récupère les stats (moyennes, count, temps
  personnel)
- `POST /api/games/[slug]/playtime` — soumet un temps de jeu (requiert
  authentification)

## Architecture

| Fichier                                         | Rôle                                               |
| ----------------------------------------------- | -------------------------------------------------- |
| `src/types/game.ts`                             | Types `PlayerPlaytimeEntry`, `PlayerPlaytimeStats` |
| `src/lib/validations/player-playtime.ts`        | Schéma Zod 3 champs                                |
| `src/lib/services/player-playtime-utils.ts`     | Calcul de moyenne                                  |
| `src/app/api/games/[slug]/playtime/route.ts`    | API GET/POST                                       |
| `src/hooks/usePlayerPlaytime.ts`                | Hook React                                         |
| `src/components/games/GamePlaytime.tsx`         | Orchestrateur                                      |
| `src/components/games/GamePlaytimeOfficial.tsx` | Cartes IGDB                                        |
| `src/components/games/GamePlaytimePlayers.tsx`  | Section communautaire                              |
| `src/components/games/PlayerPlaytimeForm.tsx`   | Dialog de saisie                                   |
