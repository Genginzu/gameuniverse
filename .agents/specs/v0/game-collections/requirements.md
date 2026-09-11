# Document des Exigences

## Introduction

Cette fonctionnalité permet aux joueurs de Game Universe de créer des listes
thématiques de jeux (collections) telles que « À jouer », « Meilleurs RPG » ou «
Nostalgie PS2 ». Chaque collection est associée à un joueur, contient un
ensemble ordonné de jeux, et peut être partagée publiquement via un lien unique.
Les collections enrichissent l'expérience sociale de la plateforme en permettant
aux joueurs d'exprimer leurs goûts et de découvrir ceux des autres.

## Glossaire

- **Système_Collections** : Module gérant la création, modification, suppression
  et affichage des collections de jeux
- **Collection** : Liste thématique de jeux créée par un joueur, avec un nom,
  une description optionnelle et un indicateur de visibilité
- **Élément_Collection** : Association entre une collection et un jeu, incluant
  un ordre d'affichage et une note optionnelle
- **Propriétaire** : Joueur authentifié qui a créé une collection
- **Page_Collections** : Page listant les collections d'un joueur
- **Page_Détail_Collection** : Page affichant le contenu d'une collection
  spécifique
- **Lien_Partage** : URL publique unique permettant d'accéder à une collection
  partagée sans authentification

## Exigences

### Exigence 1 : Création d'une collection

**User Story :** En tant que joueur connecté, je veux créer une nouvelle
collection de jeux, afin d'organiser mes jeux par thème ou par envie.

#### Critères d'acceptation

1. WHEN un joueur connecté soumet le formulaire de création avec un nom valide
   THEN le Système_Collections SHALL créer une nouvelle Collection associée au
   Propriétaire
2. WHEN un joueur tente de créer une collection avec un nom vide ou composé
   uniquement d'espaces THEN le Système_Collections SHALL rejeter la création et
   afficher un message d'erreur de validation
3. WHEN une collection est créée THEN le Système_Collections SHALL générer un
   slug unique à partir du nom de la collection
4. WHEN un joueur crée une collection THEN le Système_Collections SHALL
   initialiser la visibilité à « privée » par défaut
5. THE Système_Collections SHALL limiter le nom de la collection à 100
   caractères et la description à 500 caractères

### Exigence 2 : Gestion des jeux dans une collection

**User Story :** En tant que joueur connecté, je veux ajouter et retirer des
jeux de mes collections, afin de constituer des listes pertinentes.

#### Critères d'acceptation

1. WHEN un Propriétaire ajoute un jeu à une Collection THEN le
   Système_Collections SHALL créer un Élément_Collection avec un ordre
   d'affichage correspondant à la position suivante
2. WHEN un Propriétaire tente d'ajouter un jeu déjà présent dans la Collection
   THEN le Système_Collections SHALL rejeter l'ajout et informer le joueur que
   le jeu existe déjà
3. WHEN un Propriétaire retire un jeu d'une Collection THEN le
   Système_Collections SHALL supprimer l'Élément_Collection et réordonner les
   éléments restants
4. WHEN un Propriétaire réordonne les jeux d'une Collection THEN le
   Système_Collections SHALL mettre à jour l'ordre d'affichage de chaque
   Élément_Collection
5. THE Système_Collections SHALL permettre au Propriétaire d'ajouter une note
   textuelle optionnelle (250 caractères max) à chaque Élément_Collection

### Exigence 3 : Modification et suppression d'une collection

**User Story :** En tant que joueur connecté, je veux modifier ou supprimer mes
collections, afin de les maintenir à jour.

#### Critères d'acceptation

1. WHEN un Propriétaire modifie le nom ou la description d'une Collection THEN
   le Système_Collections SHALL mettre à jour les informations et conserver le
   slug existant
2. WHEN un Propriétaire supprime une Collection THEN le Système_Collections
   SHALL supprimer la Collection et tous ses Éléments_Collection associés
3. WHEN un Propriétaire bascule la visibilité d'une Collection entre « privée »
   et « publique » THEN le Système_Collections SHALL mettre à jour l'état de
   visibilité immédiatement
4. IF un joueur non-propriétaire tente de modifier ou supprimer une Collection
   THEN le Système_Collections SHALL refuser l'opération

### Exigence 4 : Affichage des collections d'un joueur

**User Story :** En tant qu'utilisateur, je veux voir les collections d'un
joueur, afin de découvrir ses listes thématiques.

#### Critères d'acceptation

1. WHEN un utilisateur accède à la route `/[locale]/players/[id]/collections`
   THEN le Système_Collections SHALL afficher la liste des collections publiques
   du joueur
2. WHEN le Propriétaire consulte ses propres collections THEN le
   Système_Collections SHALL afficher toutes ses collections (publiques et
   privées)
3. THE Page_Collections SHALL afficher pour chaque collection : nom, description
   tronquée, nombre de jeux, indicateur de visibilité (pour le propriétaire), et
   date de dernière modification
4. IF un joueur n'a aucune collection publique THEN le Système_Collections SHALL
   afficher un message indiquant qu'aucune collection n'est disponible
5. WHEN la page se charge THEN le Système_Collections SHALL afficher un skeleton
   de chargement pendant la récupération des données

### Exigence 5 : Affichage du détail d'une collection

**User Story :** En tant qu'utilisateur, je veux consulter le contenu d'une
collection, afin de découvrir les jeux sélectionnés par un joueur.

#### Critères d'acceptation

1. WHEN un utilisateur accède à la route
   `/[locale]/players/[id]/collections/[slug]` THEN le Système_Collections SHALL
   afficher le détail de la Collection avec ses jeux ordonnés
2. THE Page_Détail_Collection SHALL afficher : nom de la collection, description
   complète, nom du propriétaire, nombre de jeux, et date de création
3. THE Page_Détail_Collection SHALL afficher chaque jeu avec : image de
   couverture, titre, genres, et note du propriétaire si présente
4. IF la collection n'existe pas ou est privée et consultée par un
   non-propriétaire THEN le Système_Collections SHALL afficher une page 404
5. WHEN la page se charge THEN le Système_Collections SHALL afficher un skeleton
   de chargement

### Exigence 6 : Partage public d'une collection

**User Story :** En tant que joueur connecté, je veux partager mes collections
publiquement via un lien, afin que d'autres personnes puissent les consulter.

#### Critères d'acceptation

1. WHEN un Propriétaire rend une Collection publique THEN le Système_Collections
   SHALL générer un Lien_Partage accessible sans authentification
2. THE Lien_Partage SHALL correspondre à l'URL
   `/[locale]/players/[id]/collections/[slug]` de la collection publique
3. WHEN un utilisateur non authentifié accède à un Lien_Partage valide THEN le
   Système_Collections SHALL afficher le contenu de la collection
4. WHEN un Propriétaire repasse une Collection en « privée » THEN le
   Système_Collections SHALL rendre le Lien_Partage inaccessible aux
   non-propriétaires

### Exigence 7 : Internationalisation

**User Story :** En tant qu'utilisateur, je veux voir les pages de collections
dans ma langue préférée, afin d'avoir une expérience cohérente.

#### Critères d'acceptation

1. THE Système_Collections SHALL supporter les locales `fr` et `en`
2. THE Système_Collections SHALL utiliser les fichiers de traduction existants
   (`src/messages/fr.json`, `src/messages/en.json`)
3. WHEN la locale change THEN le Système_Collections SHALL mettre à jour tous
   les textes de l'interface
4. THE Système_Collections SHALL afficher les titres de jeux dans la locale
   appropriée

### Exigence 8 : Sécurité et contrôle d'accès

**User Story :** En tant que joueur, je veux que mes collections privées soient
protégées, afin que seul moi puisse les voir et les modifier.

#### Critères d'acceptation

1. THE Système_Collections SHALL appliquer des politiques RLS (Row Level
   Security) sur toutes les tables de collections
2. WHEN un utilisateur non authentifié tente d'accéder à une collection privée
   THEN le Système_Collections SHALL retourner une erreur 404
3. THE Système_Collections SHALL garantir qu'un Propriétaire a un accès complet
   (lecture, écriture, suppression) uniquement sur ses propres collections
4. WHEN un utilisateur authentifié consulte les collections d'un autre joueur
   THEN le Système_Collections SHALL afficher uniquement les collections
   publiques

### Exigence 9 : Gestion des erreurs

**User Story :** En tant qu'utilisateur, je veux voir des messages d'erreur
clairs en cas de problème, afin de comprendre ce qui s'est passé.

#### Critères d'acceptation

1. IF une erreur réseau survient lors d'une opération sur une collection THEN le
   Système_Collections SHALL afficher un message d'erreur avec option de
   réessayer
2. IF le chargement d'une collection échoue THEN le Système_Collections SHALL
   afficher un état d'erreur approprié
3. IF un jeu référencé dans une collection est supprimé de la base THEN le
   Système_Collections SHALL gérer la suppression en cascade sans erreur visible
