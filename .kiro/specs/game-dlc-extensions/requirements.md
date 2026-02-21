# Document d'exigences — Extensions et DLC de jeux

## Introduction

Cette fonctionnalité ajoute le support des DLC (addons), extensions (expansions)
et bundles liés à un jeu principal. Les standalone expansions sont considérées
comme des jeux à part entière et ne font pas partie de cette fonctionnalité.
Lors de l'import d'un jeu depuis IGDB (via la barre de recherche ou le script
d'import en masse), le système récupère et stocke automatiquement les contenus
additionnels associés. Ces contenus sont ensuite affichés dans un nouvel onglet
« Extensions et DLC » sur la page de détail du jeu.

## Glossaire

- **Système_Import** : Le service d'import de jeux (`GameImportService` et le
  script `game-importer.ts`) qui récupère les données depuis l'API IGDB et les
  persiste en base Supabase.
- **Service_IGDB** : Le service d'accès à l'API IGDB (`IGDBService`) qui
  construit et exécute les requêtes vers l'API IGDB.
- **Page_Détail** : La page de détail d'un jeu (`/[locale]/games/[slug]`) et ses
  composants associés (onglets, contenu).
- **Contenu_Additionnel** : Un DLC/addon (catégorie IGDB 1), une expansion
  (catégorie 2) ou un bundle (catégorie 4) lié à un jeu principal.
- **API_Route** : Le endpoint API Next.js qui sert les données d'un jeu
  (`/api/games/[slug]`).

## Exigences

### Exigence 1 : Récupération des identifiants de contenus additionnels depuis IGDB

**User Story :** En tant que système d'import, je veux récupérer les champs
`dlcs`, `expansions` et `bundles` depuis l'API IGDB lors de la requête de
détails d'un jeu, afin de connaître les contenus additionnels associés.

#### Critères d'acceptation

1. WHEN le Service_IGDB récupère les détails d'un jeu, THE Service_IGDB SHALL
   inclure les champs `dlcs`, `expansions` et `bundles` dans la requête IGDB
2. WHEN l'API IGDB retourne des identifiants de contenus additionnels, THE
   Service_IGDB SHALL les inclure dans l'objet `IGDBGame` retourné
3. WHEN l'API IGDB ne retourne aucun contenu additionnel pour un champ donné,
   THE Service_IGDB SHALL retourner un tableau vide pour ce champ

### Exigence 2 : Récupération des détails de chaque contenu additionnel

**User Story :** En tant que système d'import, je veux récupérer les détails
(nom, résumé, image de couverture, catégorie, date de sortie) de chaque contenu
additionnel identifié, afin de stocker des informations complètes.

#### Critères d'acceptation

1. WHEN des identifiants de contenus additionnels sont disponibles, THE
   Service_IGDB SHALL récupérer pour chaque identifiant le nom, le slug, le
   résumé, l'image de couverture, la catégorie et la date de première sortie
2. WHEN un contenu additionnel référencé par IGDB est introuvable, THE
   Service_IGDB SHALL ignorer cet identifiant et continuer le traitement des
   autres
3. IF la requête vers l'API IGDB échoue lors de la récupération des contenus
   additionnels, THEN THE Système_Import SHALL journaliser l'erreur et
   poursuivre l'import du jeu principal sans les contenus additionnels

### Exigence 3 : Persistance des contenus additionnels en base de données

**User Story :** En tant que système d'import, je veux stocker les contenus
additionnels dans une table dédiée liée au jeu principal, afin de pouvoir les
afficher ultérieurement.

#### Critères d'acceptation

1. WHEN des contenus additionnels sont récupérés depuis IGDB, THE Système_Import
   SHALL les persister dans la table `game_dlc_extensions` avec une référence au
   jeu principal
2. THE Système_Import SHALL stocker pour chaque contenu additionnel :
   l'identifiant IGDB, le nom, le slug, le résumé, l'URL de l'image de
   couverture, la catégorie (dlc, expansion, bundle) et la date de sortie
3. WHEN un contenu additionnel avec le même identifiant IGDB existe déjà pour le
   même jeu, THE Système_Import SHALL mettre à jour les données existantes au
   lieu de créer un doublon
4. WHEN le Système_Import synchronise un jeu existant, THE Système_Import SHALL
   mettre à jour les contenus additionnels en supprimant les anciens et en
   insérant les nouveaux

### Exigence 4 : Import des contenus additionnels via la barre de recherche

**User Story :** En tant qu'utilisateur, je veux que les contenus additionnels
soient automatiquement importés lorsque j'importe un jeu via la barre de
recherche, afin de disposer immédiatement de toutes les informations.

#### Critères d'acceptation

1. WHEN un jeu est importé via le endpoint `POST /api/games/import`, THE
   Système_Import SHALL récupérer et persister les contenus additionnels
   associés
2. WHEN un jeu est synchronisé via le endpoint de synchronisation, THE
   Système_Import SHALL mettre à jour les contenus additionnels associés

### Exigence 5 : Import des contenus additionnels via le script d'import en masse

**User Story :** En tant qu'administrateur, je veux que le script d'import en
masse récupère également les contenus additionnels pour chaque jeu importé, afin
de maintenir une base de données complète.

#### Critères d'acceptation

1. WHEN le script d'import en masse importe un jeu, THE Système_Import SHALL
   récupérer et persister les contenus additionnels associés
2. WHEN le script est exécuté en mode dry-run, THE Système_Import SHALL afficher
   le nombre de contenus additionnels trouvés sans les persister

### Exigence 6 : Exposition des contenus additionnels via l'API

**User Story :** En tant que page de détail, je veux accéder aux contenus
additionnels d'un jeu via l'API, afin de les afficher dans l'interface.

#### Critères d'acceptation

1. WHEN l'API_Route retourne les détails d'un jeu, THE API_Route SHALL inclure
   la liste des contenus additionnels triés par catégorie puis par date de
   sortie
2. WHEN un jeu ne possède aucun contenu additionnel, THE API_Route SHALL
   retourner un tableau vide pour le champ des contenus additionnels

### Exigence 7 : Affichage de l'onglet « Extensions et DLC »

**User Story :** En tant qu'utilisateur, je veux voir un onglet « Extensions et
DLC » sur la page de détail d'un jeu, afin de consulter les DLC, expansions et
bundles disponibles.

#### Critères d'acceptation

1. WHEN un jeu possède au moins un contenu additionnel, THE Page_Détail SHALL
   afficher un onglet « Extensions et DLC » dans la barre d'onglets
2. WHEN un jeu ne possède aucun contenu additionnel, THE Page_Détail SHALL
   masquer l'onglet « Extensions et DLC »
3. WHEN l'utilisateur sélectionne l'onglet « Extensions et DLC », THE
   Page_Détail SHALL afficher les contenus additionnels regroupés par catégorie
   (DLC, Expansion, Bundle)
4. THE Page_Détail SHALL afficher pour chaque contenu additionnel : le nom,
   l'image de couverture, le résumé et la date de sortie
5. WHEN un contenu additionnel correspond à un jeu déjà présent dans la base de
   données, THE Page_Détail SHALL afficher un lien vers la page de détail de ce
   jeu

### Exigence 8 : Internationalisation

**User Story :** En tant qu'utilisateur francophone ou anglophone, je veux que
l'onglet et les libellés de catégories soient traduits dans ma langue, afin de
naviguer confortablement.

#### Critères d'acceptation

1. THE Page_Détail SHALL afficher le titre de l'onglet et les noms de catégories
   dans la langue active de l'utilisateur (français ou anglais)
2. WHEN la langue active change, THE Page_Détail SHALL mettre à jour les
   libellés de l'onglet et des catégories
