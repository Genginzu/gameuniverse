# Document des Exigences

## Introduction

Cette fonctionnalité permet d'importer les différentes versions d'un jeu
(éditions collector, deluxe, GOTY, etc.) depuis l'API IGDB lors de l'import d'un
jeu. Ces versions sont stockées dans le jeu principal et affichées dans une
nouvelle section "Versions" sur la page de détail du jeu, positionnée après la
section des classifications d'âge.

Sur IGDB, les versions d'un jeu sont accessibles via le champ `version_parent`
et `version_title` qui permettent d'identifier les différentes éditions d'un
même jeu de base.

## Glossaire

- **Système_Import**: Le système d'import IGDB existant qui récupère les données
  des jeux depuis l'API IGDB
- **Version_Jeu**: Une édition spécifique d'un jeu (ex: Standard, Collector,
  Deluxe, GOTY, Complete Edition)
- **Jeu_Principal**: Le jeu de base auquel sont rattachées les différentes
  versions
- **API_IGDB**: L'API Internet Game Database qui fournit les données des jeux
  vidéo
- **Page_Détail**: La page de détail d'un jeu affichant toutes ses informations

## Exigences

### Exigence 1 : Récupération des versions depuis IGDB

**User Story:** En tant que système d'import, je veux récupérer les versions
d'un jeu depuis l'API IGDB, afin de pouvoir les stocker avec le jeu principal.

#### Critères d'Acceptation

1. QUAND le Système_Import importe un jeu depuis IGDB, ALORS le Système_Import
   DOIT récupérer toutes les versions associées via le champ `version_parent` de
   l'API IGDB
2. QUAND une Version_Jeu est récupérée, ALORS le Système_Import DOIT extraire le
   nom de la version (`version_title`), l'identifiant IGDB, et l'image de
   couverture si disponible
3. SI aucune version n'est trouvée pour un jeu, ALORS le Système_Import DOIT
   continuer l'import normalement sans erreur
4. QUAND le Système_Import récupère les versions, ALORS le Système_Import DOIT
   respecter le rate limiting de l'API IGDB (4 requêtes/seconde)

### Exigence 2 : Stockage des versions en base de données

**User Story:** En tant que développeur, je veux que les versions soient
stockées dans une table dédiée liée au jeu principal, afin de pouvoir les
afficher et les gérer facilement.

#### Critères d'Acceptation

1. LE Système_Import DOIT créer une table `game_versions` avec les champs : id,
   game_id (référence au jeu principal), igdb_id, version_title,
   cover_image_url, display_order, created_at
2. QUAND une Version_Jeu est importée, ALORS le Système_Import DOIT l'associer
   au Jeu_Principal via la clé étrangère game_id
3. QUAND plusieurs versions sont importées, ALORS le Système_Import DOIT les
   ordonner par leur identifiant IGDB pour maintenir un ordre cohérent
4. SI une version existe déjà pour un jeu (même igdb_id), ALORS le
   Système_Import DOIT ignorer le doublon

### Exigence 3 : Affichage des versions sur la page de détail

**User Story:** En tant qu'utilisateur, je veux voir les différentes versions
d'un jeu sur sa page de détail, afin de connaître toutes les éditions
disponibles.

#### Critères d'Acceptation

1. QUAND un utilisateur consulte la Page_Détail d'un jeu, ALORS le système DOIT
   afficher une section "Versions" après l'onglet des classifications d'âge
2. QUAND des versions existent pour un jeu, ALORS le système DOIT afficher
   chaque version avec son nom et son image de couverture
3. SI aucune version n'existe pour un jeu, ALORS le système DOIT masquer la
   section "Versions"
4. QUAND les versions sont affichées, ALORS le système DOIT les présenter dans
   l'ordre défini par display_order

### Exigence 4 : Intégration avec l'import en masse

**User Story:** En tant qu'administrateur, je veux que l'import en masse
récupère aussi les versions des jeux, afin d'avoir des données complètes
automatiquement.

#### Critères d'Acceptation

1. QUAND le script d'import en masse traite un jeu, ALORS le Système_Import DOIT
   également récupérer et stocker ses versions
2. QUAND le mode dry-run est activé, ALORS le Système_Import DOIT simuler
   l'import des versions sans les écrire en base
3. SI une erreur survient lors de l'import des versions, ALORS le Système_Import
   DOIT logger l'erreur et continuer avec le jeu suivant
4. QUAND le mode verbose est activé, ALORS le Système_Import DOIT afficher le
   nombre de versions trouvées pour chaque jeu

### Exigence 5 : API pour récupérer les versions

**User Story:** En tant que développeur frontend, je veux une API pour récupérer
les versions d'un jeu, afin de les afficher sur la page de détail.

#### Critères d'Acceptation

1. QUAND l'API de détail d'un jeu est appelée, ALORS le système DOIT inclure les
   versions dans la réponse
2. QUAND les versions sont retournées par l'API, ALORS le système DOIT inclure
   pour chaque version : id, version_title, cover_image_url
3. SI le jeu n'a pas de versions, ALORS l'API DOIT retourner un tableau vide
   pour le champ versions
