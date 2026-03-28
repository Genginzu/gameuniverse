# Extensions et DLC de jeux

## Description

La fonctionnalité **Extensions et DLC** ajoute le support des DLC (addons),
expansions et bundles liés à un jeu principal. Lors de l'import d'un jeu depuis
IGDB (via la barre de recherche ou le script d'import en masse), le système
récupère et stocke automatiquement les contenus additionnels associés. Ces
contenus sont affichés dans un onglet « Extensions et DLC » sur la page de
détail du jeu.

Fonctionnalités principales :

- Import automatique des DLC, expansions et bundles lors de l'import d'un jeu
- Mise à jour des contenus additionnels lors de la synchronisation d'un jeu
- Import en masse avec support dry-run
- Affichage conditionnel d'un onglet « Extensions et DLC » sur la page de détail
- Regroupement par catégorie : DLC, Expansions, Bundles
- Lien vers la fiche du jeu si le DLC/extension est aussi importé localement
- Internationalisation FR/EN

## Accès

### Page

L'onglet « Extensions et DLC » apparaît sur la page de détail d'un jeu
`/[locale]/games/[slug]` lorsque le jeu possède au moins un contenu additionnel.
L'onglet est masqué si aucun contenu additionnel n'existe.

Le contenu est regroupé par catégorie (DLC, Expansions, Bundles). Chaque carte
affiche l'image de couverture, le nom, le résumé, la date de sortie, et un lien
vers la fiche du jeu si le DLC est aussi importé dans la base locale.

### Route API

| Méthode | Route               | Description                                          |
| ------- | ------------------- | ---------------------------------------------------- |
| GET     | `/api/games/[slug]` | Retourne les détails du jeu incluant `dlcExtensions` |

Le champ `dlcExtensions` est un tableau trié par catégorie puis par date de
sortie. Il est vide si le jeu n'a aucun contenu additionnel.

### Catégories IGDB

| Catégorie IGDB | Code | Catégorie locale |
| -------------- | ---- | ---------------- |
| DLC/Addon      | 1    | `dlc`            |
| Expansion      | 2    | `expansion`      |
| Bundle         | 4    | `bundle`         |

## Prérequis

1. **Migration Supabase** : la migration
   `supabase/migrations/20240301000001_game_dlc_extensions.sql` doit être
   appliquée. Elle crée la table `game_dlc_extensions` avec index, contraintes,
   et politiques RLS (lecture publique, écriture service_role).
2. **Identifiants IGDB** : les variables d'environnement `IGDB_CLIENT_ID` et
   `IGDB_CLIENT_SECRET` doivent être configurées pour permettre la récupération
   des contenus additionnels depuis l'API IGDB.

## Utilisation

### Import automatique (barre de recherche)

Lors de l'import d'un jeu via `POST /api/games/import`, les DLC, expansions et
bundles sont automatiquement récupérés depuis IGDB et stockés dans la table
`game_dlc_extensions`. Aucune action supplémentaire n'est requise.

### Synchronisation d'un jeu existant

Lors de la synchronisation d'un jeu existant, les contenus additionnels sont mis
à jour : les anciennes entrées sont supprimées et remplacées par les données
fraîches d'IGDB.

### Import en masse

Le script d'import en masse (`scripts/igdb-import/`) importe également les
contenus additionnels pour chaque jeu. Le mode dry-run affiche le nombre de
contenus additionnels trouvés sans les persister.

### Gestion des erreurs

- Si l'API IGDB est indisponible lors du fetch des DLC, l'import du jeu
  principal continue sans les contenus additionnels
- Les IDs de DLC introuvables dans IGDB sont ignorés silencieusement
- Les erreurs d'insertion en base sont journalisées sans bloquer l'import

## Architecture

### Base de données

- `game_dlc_extensions` — Contenus additionnels avec igdb_id, name, slug,
  summary, category, cover_image_url, release_date, liés au jeu principal via
  game_id. Contrainte UNIQUE(game_id, igdb_id).

### Types

- `src/types/igdb.ts` — `IGDBDlcExtension` (données brutes IGDB)
- `src/types/game.ts` — `GameDlcExtension`, `DlcExtensionCategory` (types
  applicatifs)

### Utilitaires (`src/lib/utils/dlcExtensionUtils.ts`)

- `transformIgdbToDlcExtensionRow()` — Transformation IGDB → row DB
- `collectDlcExtensionIds()` — Collecte et tagage des IDs depuis un IGDBGame
- `sortDlcExtensions()` — Tri par catégorie puis date
- `groupDlcExtensionsByCategory()` — Regroupement par catégorie

### Services

- `src/lib/services/igdbService.ts` — `getDlcExtensions()` : récupération batch
  des détails depuis IGDB
- `src/lib/services/gameImportService.ts` — `createDlcExtensions()`,
  `updateDlcExtensions()` : persistance et mise à jour en base

### API

- `src/app/api/games/[slug]/route.ts` — Inclut `dlcExtensions` dans la réponse
  avec résolution des liens vers les jeux locaux

### Composants React

- `src/components/games/GameDlcExtensions.tsx` — Affichage des contenus
  regroupés par catégorie avec cartes
- `src/components/games/details/GameDetailsTabs.tsx` — Onglet conditionnel «
  Extensions et DLC »

### Script d'import en masse

- `scripts/igdb-import/game-importer.ts` — `importDlcExtensions()` : import des
  contenus additionnels avec support dry-run

### Internationalisation

Clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`,
sections `gameDetails.tabs.dlcExtensions` et `gameDetails.dlcExtensions`.

## Tests

- Tests property-based (fast-check) :
  `test/unit/lib/utils/dlcExtensionUtils.property.test.ts` (transformation, tri,
  regroupement)
- Tests property-based composant :
  `test/unit/components/games/GameDlcExtensions.property.test.ts` (complétude du
  rendu)
