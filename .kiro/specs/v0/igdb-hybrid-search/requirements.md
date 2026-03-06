# Document des Exigences

## Introduction

Cette fonctionnalité implémente une recherche hybride qui combine les résultats
de la base de données Supabase locale avec l'API IGDB externe. Lorsqu'un
utilisateur effectue une recherche dans la barre de recherche, le système
interroge simultanément les deux sources et affiche les résultats dans un
dropdown unifié. Le système gère intelligemment la synchronisation des données
entre IGDB et la base locale.

## Glossaire

- **Système_Recherche_Hybride**: Le système de recherche qui combine les
  résultats Supabase et IGDB
- **Barre_Recherche**: Le composant UI de recherche situé en haut de
  l'application (GameSearchBar)
- **Dropdown_Résultats**: Le menu déroulant affichant les résultats de recherche
  sous la barre
- **Jeu_Local**: Un jeu existant dans la base de données Supabase
- **Jeu_IGDB**: Un jeu provenant de l'API IGDB externe
- **Mise_à_Jour_Background**: Processus de synchronisation des données IGDB en
  arrière-plan
- **API_IGDB**: L'API externe Internet Game Database fournissant les métadonnées
  de jeux

## Exigences

### Exigence 1: Recherche Parallèle

**User Story:** En tant qu'utilisateur, je veux que ma recherche interroge à la
fois la base locale et IGDB, afin de trouver des jeux même s'ils ne sont pas
encore dans la base de données.

#### Critères d'Acceptation

1. QUAND un utilisateur saisit une requête de recherche d'au moins 2 caractères,
   ALORS le Système_Recherche_Hybride DOIT lancer une recherche dans Supabase
2. QUAND un utilisateur saisit une requête de recherche d'au moins 2 caractères,
   ALORS le Système_Recherche_Hybride DOIT lancer une recherche dans l'API_IGDB
3. QUAND les deux recherches sont lancées, ALORS le Système_Recherche_Hybride
   DOIT les exécuter en parallèle pour minimiser le temps de réponse
4. SI une des sources échoue, ALORS le Système_Recherche_Hybride DOIT afficher
   les résultats de l'autre source disponible

### Exigence 2: Affichage des Résultats

**User Story:** En tant qu'utilisateur, je veux voir les résultats de recherche
dans un dropdown sous la barre de recherche, afin de sélectionner rapidement un
jeu.

#### Critères d'Acceptation

1. QUAND des résultats sont disponibles, ALORS le Dropdown_Résultats DOIT
   afficher les jeux trouvés avec leur image de couverture, titre et développeur
2. QUAND des résultats proviennent des deux sources, ALORS le Dropdown_Résultats
   DOIT afficher les jeux locaux en premier, suivis des jeux IGDB non présents
   en base
3. QUAND des résultats sont affichés, ALORS le Dropdown_Résultats DOIT indiquer
   visuellement la source de chaque jeu (local vs IGDB)
4. QUAND des résultats sont disponibles, ALORS le Dropdown_Résultats DOIT
   afficher un lien "Voir tous les résultats" en dernière ligne
5. QUAND aucun résultat n'est trouvé dans les deux sources, ALORS le
   Dropdown_Résultats DOIT afficher un message "Aucun jeu trouvé"
6. PENDANT que la recherche est en cours, ALORS le Dropdown_Résultats DOIT
   afficher un indicateur de chargement

### Exigence 3: Déduplication des Résultats

**User Story:** En tant qu'utilisateur, je veux voir chaque jeu une seule fois
dans les résultats, afin d'éviter la confusion avec des doublons.

#### Critères d'Acceptation

1. QUAND un jeu existe à la fois en base locale et dans les résultats IGDB,
   ALORS le Système_Recherche_Hybride DOIT afficher uniquement la version locale
2. QUAND le système déduplique les résultats, ALORS il DOIT utiliser
   l'identifiant IGDB comme clé de correspondance
3. QUAND le système déduplique les résultats, ALORS il DOIT préserver l'ordre de
   priorité (local d'abord)

### Exigence 4: Sélection d'un Jeu Existant

**User Story:** En tant qu'utilisateur, je veux que lorsque je clique sur un jeu
déjà en base, les informations s'affichent immédiatement et se mettent à jour en
arrière-plan, afin d'avoir une expérience fluide avec des données à jour.

#### Critères d'Acceptation

1. QUAND un utilisateur clique sur un Jeu_Local, ALORS le système DOIT naviguer
   immédiatement vers la page du jeu avec les données existantes
2. QUAND un utilisateur clique sur un Jeu*Local, ALORS le système DOIT
   déclencher une Mise*à_Jour_Background depuis l'API_IGDB
3. PENDANT la Mise_à_Jour_Background, ALORS le système DOIT mettre à jour les
   données du jeu sans interrompre l'affichage
4. SI la Mise_à_Jour_Background échoue, ALORS le système DOIT conserver les
   données existantes et logger l'erreur

### Exigence 5: Création d'un Nouveau Jeu

**User Story:** En tant qu'utilisateur, je veux que lorsque je clique sur un jeu
IGDB non présent en base, le système le crée automatiquement, afin d'enrichir la
base de données.

#### Critères d'Acceptation

1. QUAND un utilisateur clique sur un Jeu_IGDB non présent en base, ALORS le
   système DOIT récupérer les informations complètes depuis l'API_IGDB
2. QUAND les informations IGDB sont récupérées, ALORS le système DOIT créer le
   jeu dans la base Supabase avec toutes les données disponibles
3. QUAND le jeu est créé, ALORS le système DOIT créer les traductions (FR et EN)
   si disponibles
4. QUAND le jeu est créé, ALORS le système DOIT associer les genres,
   développeurs et éditeurs existants ou les créer si nécessaire
5. QUAND le jeu est créé avec succès, ALORS le système DOIT naviguer vers la
   page du nouveau jeu
6. SI la création échoue, ALORS le système DOIT afficher un message d'erreur à
   l'utilisateur

### Exigence 6: Intégration API IGDB

**User Story:** En tant que développeur, je veux une intégration robuste avec
l'API IGDB, afin de récupérer des données de jeux fiables.

#### Critères d'Acceptation

1. LE Système_Recherche_Hybride DOIT s'authentifier auprès de l'API_IGDB via les
   credentials Twitch (Client ID et Secret)
2. QUAND une requête IGDB est effectuée, ALORS le système DOIT gérer le rate
   limiting de l'API
3. QUAND une requête IGDB est effectuée, ALORS le système DOIT mettre en cache
   le token d'authentification jusqu'à expiration
4. QUAND des données IGDB sont récupérées, ALORS le système DOIT transformer les
   données au format GameSummary/GameDetails existant

### Exigence 7: Performance et UX

**User Story:** En tant qu'utilisateur, je veux une recherche réactive et
fluide, afin d'avoir une bonne expérience utilisateur.

#### Critères d'Acceptation

1. QUAND l'utilisateur tape dans la Barre_Recherche, ALORS le système DOIT
   appliquer un debounce de 300ms avant de lancer la recherche
2. QUAND une nouvelle recherche est lancée, ALORS le système DOIT annuler les
   requêtes précédentes en cours
3. LE Dropdown_Résultats DOIT limiter l'affichage à 5 jeux locaux et 5 jeux IGDB
   maximum
4. QUAND l'utilisateur clique en dehors du Dropdown_Résultats, ALORS celui-ci
   DOIT se fermer
5. QUAND l'utilisateur appuie sur Échap, ALORS le Dropdown_Résultats DOIT se
   fermer
